import "server-only";
import { z } from "zod";
import type { ActionState } from "./types";
import { UploadError } from "@/lib/storage";
import { isSafeUrl } from "@/lib/utils";

export const str = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
};
export const bool = (fd: FormData, key: string) => fd.get(key) === "on" || fd.get(key) === "1" || fd.get(key) === "true";
export const int = (fd: FormData, key: string, fallback = 0) => {
  const n = Number.parseInt(str(fd, key), 10);
  return Number.isFinite(n) ? n : fallback;
};

export const zUrl = z
  .string()
  .max(2000)
  .refine((v) => isSafeUrl(v), "URL no válida (debe empezar por https:// o /)");

export function fromZod(error: z.ZodError): ActionState {
  return { error: "Revisa los campos marcados.", fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[]> };
}

export function fromError(e: unknown): ActionState {
  if (e instanceof UploadError) return { error: e.message };
  console.error(e);
  return { error: "Ocurrió un error inesperado. Inténtalo de nuevo." };
}
