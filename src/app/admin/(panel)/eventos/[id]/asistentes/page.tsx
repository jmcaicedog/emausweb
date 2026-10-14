import { ArrowLeft, FileSpreadsheet, FileText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, buttonCls } from "@/components/admin/ui";
import { adminEvent, eventAttendees } from "@/lib/data/admin";
import { formatDateTime, formatShortDate } from "@/lib/dates";

// Panel privado: render dinámico por petición, sin validación de navegación instantánea.
export const instant = false;

export const metadata = { title: "Asistentes" };

export default async function AttendeesPage({ params }: PageProps<"/admin/eventos/[id]/asistentes">) {
  const { id } = await params;
  const event = await adminEvent(Number(id));
  if (!event) notFound();
  const list = await eventAttendees(event.id);

  return (
    <>
      <Link href={`/admin/eventos/${event.id}`} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-stone-600 hover:text-brand-700">
        <ArrowLeft className="size-4" /> {event.title}
      </Link>
      <PageHeader
        title={`Asistentes (${list.length})`}
        description={`${event.title} · ${formatDateTime(event.startsAt)}`}
        actions={
          list.length > 0 && (
            <>
              <a href={`/admin/export/${event.id}?format=xlsx`} className={buttonCls.secondary}>
                <FileSpreadsheet className="size-4" /> Excel
              </a>
              <a href={`/admin/export/${event.id}?format=csv`} className={buttonCls.secondary}>
                <FileText className="size-4" /> CSV
              </a>
            </>
          )
        }
      />
      {list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-500">Nadie se ha registrado todavía.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs font-bold tracking-wide text-stone-500 uppercase">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Cédula</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Nacimiento</th>
                <th className="px-4 py-3">Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {list.map((a, i) => (
                <tr key={a.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3 text-stone-500 tabular-nums">{i + 1}</td>
                  <td className="px-4 py-3 font-semibold">
                    <Link href={`/admin/personas/${a.personId}`} className="hover:text-brand-700">{a.fullName}</Link>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{a.documentNumber}</td>
                  <td className="px-4 py-3 tabular-nums">{a.phone}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatShortDate(a.birthDate)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-stone-600">{formatDateTime(a.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
