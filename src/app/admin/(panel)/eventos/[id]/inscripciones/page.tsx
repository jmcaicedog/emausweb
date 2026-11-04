import { ArrowLeft, CheckCircle2, Clock3, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SpecialEventPaymentForm } from "@/components/admin/special-event-payment-form";
import { Badge, PageHeader, buttonCls } from "@/components/admin/ui";
import { adminEvent, eventSpecialRegistrations } from "@/lib/data/admin";
import { formatDateTime, formatShortDate } from "@/lib/dates";

export const instant = false;

export const metadata = { title: "Inscripciones" };

export default async function SpecialEventRegistrationsPage({ params }: PageProps<"/admin/eventos/[id]/inscripciones">) {
  const { id } = await params;
  const event = await adminEvent(Number(id));
  if (!event?.isSpecial) notFound();
  const registrations = await eventSpecialRegistrations(event.id);
  const totalPeople = registrations.reduce((total, registration) => total + registration.companions + 1, 0);
  const totalDue = registrations.reduce((total, registration) => total + registration.amountDue, 0);
  const totalPaid = registrations.reduce((total, registration) => total + registration.amountPaid, 0);

  return (
    <>
      <Link href={`/admin/eventos/${event.id}`} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-stone-600 hover:text-brand-700">
        <ArrowLeft className="size-4" /> {event.title}
      </Link>
      <PageHeader
        title={`Inscritos (${registrations.length})`}
        description={`${event.title} · ${formatDateTime(event.startsAt)}`}
        actions={
          event.published && event.registrationToken ? (
            <Link href={`/inscripcion/${event.registrationToken}`} target="_blank" className={buttonCls.secondary}>
              <ExternalLink className="size-4" /> Formulario público
            </Link>
          ) : undefined
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Summary label="Personas incluidas" value={totalPeople} />
        <Summary label="Total por recaudar" value={formatCurrency(totalDue)} />
        <Summary label="Total recaudado" value={formatCurrency(totalPaid)} />
      </div>

      {registrations.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-500">Aún no hay inscripciones.</p>
      ) : (
        <div className="space-y-4">
          {registrations.map((registration, index) => {
            const balance = registration.amountDue - registration.amountPaid;
            const qrUrl = `/qr/inscripcion/${registration.attendanceToken}`;
            return (
              <article key={registration.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-xs sm:p-5">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-extrabold">{index + 1}. {registration.fullName}</h2>
                      {registration.checkedInAt ? (
                        <Badge tone="green"><span className="inline-flex items-center gap-1"><CheckCircle2 className="size-3" /> Asistió</span></Badge>
                      ) : (
                        <Badge tone="amber"><span className="inline-flex items-center gap-1"><Clock3 className="size-3" /> Pendiente</span></Badge>
                      )}
                    </div>
                    <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                      <Info label="Documento" value={registration.documentNumber} />
                      <Info label="Teléfono" value={registration.phone} />
                      <Info label="Nacimiento" value={formatShortDate(registration.birthDate)} />
                      <Info label="Inscripción" value={formatDateTime(registration.createdAt)} />
                      <Info label="Acompañantes" value={String(registration.companions)} />
                      <Info label="Personas en el grupo" value={String(registration.companions + 1)} />
                      <Info label="Total" value={formatCurrency(registration.amountDue)} />
                      <Info label="Abonado" value={formatCurrency(registration.amountPaid)} />
                      <Info label="Saldo" value={formatCurrency(balance)} />
                    </dl>
                    {registration.payments.length > 0 && (
                      <details className="mt-4">
                        <summary className="cursor-pointer text-sm font-semibold text-brand-700 hover:underline">
                          Historial de pagos ({registration.payments.length})
                        </summary>
                        <ul className="mt-2 space-y-1 text-xs text-stone-600">
                          {registration.payments.map((payment) => (
                            <li key={payment.id}>
                              {formatDateTime(payment.createdAt)} · {formatCurrency(payment.amount)} · Registró: {payment.adminName}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                    <div className="mt-4 border-t border-stone-100 pt-4">
                      <SpecialEventPaymentForm registrationId={registration.id} balance={balance} />
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 rounded-lg bg-stone-50 p-3 lg:flex-col">
                    <Image src={qrUrl} alt={`Código QR de asistencia de ${registration.fullName}`} width={96} height={96} className="size-24 rounded bg-white p-1" unoptimized />
                    <div className="text-xs text-stone-600 lg:text-center">
                      <p className="font-bold">QR del grupo</p>
                      {registration.checkedInAt && <p>{formatDateTime(registration.checkedInAt)}</p>}
                      <a href={qrUrl} download={`asistencia-${registration.id}.png`} className="mt-1 inline-block font-semibold text-brand-700 hover:underline">Descargar</a>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

function Summary({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-1 text-xl font-extrabold tabular-nums">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs text-stone-500">{label}</dt><dd className="font-semibold">{value}</dd></div>;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(amount);
}
