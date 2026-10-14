import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import { db } from "@/db";
import { events } from "@/db/schema";
import { getAdmin } from "@/lib/auth/dal";
import { siteUrl } from "@/lib/utils";

export async function GET(_: Request, ctx: RouteContext<"/admin/qr/[id]">) {
  if (!(await getAdmin())) return new Response("No autorizado", { status: 401 });
  const { id } = await ctx.params;
  const [event] = await db.select({ token: events.attendanceToken, slug: events.slug }).from(events).where(eq(events.id, Number(id))).limit(1);
  if (!event) return new Response("No encontrado", { status: 404 });
  const png = await QRCode.toBuffer(`${siteUrl()}/asistencia/${event.token}`, { type: "png", width: 1024, margin: 2, errorCorrectionLevel: "M" });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="qr-${event.slug}.png"`,
      "Cache-Control": "private, no-store",
    },
  });
}
