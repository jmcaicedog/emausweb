import { Plus, QrCode, Users } from "lucide-react";
import Link from "next/link";
import { Badge, PageHeader, buttonCls } from "@/components/admin/ui";
import { adminEvents } from "@/lib/data/admin";
import { formatDateTime } from "@/lib/dates";

// Panel privado: render dinámico por petición, sin validación de navegación instantánea.
export const instant = false;

export const metadata = { title: "Eventos" };

export default async function EventsPage() {
  const list = await adminEvents();
  return (
    <>
      <PageHeader
        title="Eventos"
        description="Cada evento tiene su propio código QR para el llamado a lista."
        actions={
          <Link href="/admin/eventos/nuevo" className={buttonCls.primary}>
            <Plus className="size-4" /> Nuevo evento
          </Link>
        }
      />
      {list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-500">Aún no hay eventos.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs font-bold tracking-wide text-stone-500 uppercase">
              <tr>
                <th className="px-4 py-3">Evento</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Asistentes</th>
                <th className="px-4 py-3"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {list.map((e) => (
                <tr key={e.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/eventos/${e.id}`} className="font-bold hover:text-brand-700">
                      {e.title}
                    </Link>
                    {e.location && <p className="text-xs text-stone-500">{e.location}</p>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(e.startsAt)}</td>
                  <td className="px-4 py-3">{e.published ? <Badge tone="green">Publicado</Badge> : <Badge>Borrador</Badge>}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{e.attendees}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link href={`/admin/eventos/${e.id}#qr`} className={buttonCls.ghost} title="Código QR">
                        <QrCode className="size-4" /><span className="sr-only">Código QR</span>
                      </Link>
                      <Link href={`/admin/eventos/${e.id}/asistentes`} className={buttonCls.ghost} title="Asistentes">
                        <Users className="size-4" /><span className="sr-only">Asistentes</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
