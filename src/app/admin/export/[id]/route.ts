import { eq } from "drizzle-orm";
import { db } from "@/db";
import { events } from "@/db/schema";
import { getAdmin } from "@/lib/auth/dal";
import { eventAttendees } from "@/lib/data/admin";
import { formatDateTime } from "@/lib/dates";
import { toCsv, toXlsx } from "@/lib/export";

const COLUMNS = [
  { key: "n", header: "#", width: 6 },
  { key: "documentNumber", header: "Cédula", width: 16 },
  { key: "fullName", header: "Nombre completo", width: 34 },
  { key: "phone", header: "Teléfono", width: 16 },
  { key: "birthDate", header: "Fecha de nacimiento", width: 18 },
  { key: "createdAt", header: "Registrado", width: 24 },
];

export async function GET(request: Request, ctx: RouteContext<"/admin/export/[id]">) {
  if (!(await getAdmin())) return new Response("No autorizado", { status: 401 });
  const { id } = await ctx.params;
  const [event] = await db.select({ id: events.id, slug: events.slug, title: events.title }).from(events).where(eq(events.id, Number(id))).limit(1);
  if (!event) return new Response("No encontrado", { status: 404 });

  const list = await eventAttendees(event.id);
  const rows = list.map((a, i) => ({
    n: i + 1,
    documentNumber: a.documentNumber,
    fullName: a.fullName,
    phone: a.phone,
    birthDate: a.birthDate,
    createdAt: formatDateTime(a.createdAt),
  }));
  const format = new URL(request.url).searchParams.get("format");
  const base = `asistentes-${event.slug}`;
  const headers = { "Cache-Control": "private, no-store" };

  if (format === "xlsx") {
    const buf = await toXlsx(event.title, COLUMNS, rows);
    return new Response(new Uint8Array(buf), {
      headers: {
        ...headers,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${base}.xlsx"`,
      },
    });
  }
  return new Response(toCsv(COLUMNS, rows), {
    headers: { ...headers, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${base}.csv"` },
  });
}
