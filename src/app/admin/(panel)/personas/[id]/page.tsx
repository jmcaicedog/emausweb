import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, PageHeader } from "@/components/admin/ui";
import { adminPerson } from "@/lib/data/admin";
import { formatDateTime, formatShortDate } from "@/lib/dates";

// Panel privado: render dinámico por petición, sin validación de navegación instantánea.
export const instant = false;

export const metadata = { title: "Persona" };

export default async function PersonPage({ params }: PageProps<"/admin/personas/[id]">) {
  const { id } = await params;
  const data = await adminPerson(Number(id));
  if (!data) notFound();
  const { person, history } = data;
  return (
    <>
      <Link href="/admin/personas" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-stone-600 hover:text-brand-700">
        <ArrowLeft className="size-4" /> Personas
      </Link>
      <PageHeader title={person.fullName} />
      <div className="grid gap-6 md:grid-cols-[18rem_1fr]">
        <Card title="Datos">
          <dl className="space-y-3 text-sm">
            <div><dt className="text-stone-500">Cédula</dt><dd className="font-semibold">{person.documentNumber}</dd></div>
            <div><dt className="text-stone-500">Teléfono</dt><dd className="font-semibold"><a href={`tel:${person.phone}`} className="hover:text-brand-700">{person.phone}</a></dd></div>
            <div><dt className="text-stone-500">Fecha de nacimiento</dt><dd className="font-semibold">{formatShortDate(person.birthDate)}</dd></div>
            <div><dt className="text-stone-500">Autorizó tratamiento de datos</dt><dd className="font-semibold">{person.consentAt ? formatDateTime(person.consentAt) : "—"}</dd></div>
          </dl>
        </Card>
        <Card title={`Historial de asistencia (${history.length})`}>
          {history.length === 0 ? (
            <p className="text-sm text-stone-500">Sin asistencias registradas.</p>
          ) : (
            <ol className="divide-y divide-stone-100">
              {history.map((h) => (
                <li key={h.eventId} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 text-sm">
                  <Link href={`/admin/eventos/${h.eventId}/asistentes`} className="font-semibold hover:text-brand-700">{h.title}</Link>
                  <span className="text-stone-500">{formatDateTime(h.startsAt)}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </>
  );
}
