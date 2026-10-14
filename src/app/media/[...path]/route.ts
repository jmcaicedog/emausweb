import { readFile } from "node:fs/promises";
import path from "node:path";
import { LOCAL_UPLOAD_DIR } from "@/lib/storage";

// Solo para desarrollo local sin Vercel Blob.
export async function GET(_req: Request, ctx: RouteContext<"/media/[...path]">) {
  const { path: parts } = await ctx.params;
  const target = path.join(LOCAL_UPLOAD_DIR, ...parts);
  if (!target.startsWith(LOCAL_UPLOAD_DIR + path.sep)) return new Response("No encontrado", { status: 404 });
  try {
    const data = await readFile(target);
    return new Response(data, {
      headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new Response("No encontrado", { status: 404 });
  }
}
