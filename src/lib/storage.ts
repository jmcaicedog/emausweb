import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { del, put } from "@vercel/blob";

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
export const LOCAL_UPLOAD_DIR = path.join(process.cwd(), ".uploads");

export class UploadError extends Error {}

export function hasFile(value: FormDataEntryValue | null): value is File {
  return typeof value === "object" && value !== null && "size" in value && value.size > 0;
}

/** Optimiza la imagen (WebP, ancho máximo) y la guarda en Vercel Blob o en disco local. */
export async function uploadImage(file: File, folder: string, maxWidth = 2000) {
  if (!ALLOWED.includes(file.type)) throw new UploadError("Formato de imagen no permitido");
  if (file.size > MAX_BYTES) throw new UploadError("La imagen supera 4 MB");

  const input = Buffer.from(await file.arrayBuffer());
  const output = await sharp(input)
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const name = `${folder}/${Date.now()}-${randomBytes(6).toString("hex")}.webp`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(name, output, {
        access: "public",
        contentType: "image/webp",
        cacheControlMaxAge: 60 * 60 * 24 * 365,
      });
      return blob.url;
    } catch (e) {
      console.error("Error subiendo a Vercel Blob", e);
      if (e instanceof Error && /private/i.test(e.message)) {
        throw new UploadError("El almacenamiento de imágenes es privado. Debe configurarse un Blob Store público en Vercel.");
      }
      throw new UploadError("No se pudo subir la imagen. Inténtalo de nuevo.");
    }
  }

  const target = path.join(LOCAL_UPLOAD_DIR, name);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, output);
  return `/media/${name}`;
}

export async function deleteImage(url: string | null | undefined) {
  if (!url) return;
  try {
    if (url.startsWith("/media/")) {
      const rel = url.slice("/media/".length);
      const target = path.join(LOCAL_UPLOAD_DIR, rel);
      if (target.startsWith(LOCAL_UPLOAD_DIR)) await unlink(target);
    } else if (process.env.BLOB_READ_WRITE_TOKEN && url.includes(".blob.vercel-storage.com")) {
      await del(url);
    }
  } catch (e) {
    console.error("No se pudo eliminar la imagen", e);
  }
}
