import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import { db } from "@/db";
import { eventRegistrations } from "@/db/schema";
import { siteUrl } from "@/lib/utils";

export async function GET(_: Request, context: RouteContext<"/qr/inscripcion/[token]">) {
  const { token } = await context.params;
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return new Response("No encontrado", { status: 404 });
  const [registration] = await db
    .select({ id: eventRegistrations.id })
    .from(eventRegistrations)
    .where(eq(eventRegistrations.attendanceToken, token))
    .limit(1);
  if (!registration) return new Response("No encontrado", { status: 404 });
  const png = await QRCode.toBuffer(`${siteUrl()}/admin/asistencia-especial/${token}`, {
    type: "png",
    width: 1024,
    margin: 2,
    errorCorrectionLevel: "M",
  });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": 'inline; filename="qr-asistencia-evento.png"',
      "Cache-Control": "private, no-store",
    },
  });
}
