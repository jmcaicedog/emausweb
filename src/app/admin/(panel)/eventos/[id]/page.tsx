import { ExternalLink, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { EventFields } from "@/components/admin/event-fields";
import { ActionForm, ConfirmSubmit, SubmitButton } from "@/components/admin/form";
import { QrPanel } from "@/components/admin/qr-panel";
import { Badge, Card, PageHeader, buttonCls } from "@/components/admin/ui";
import { deleteEvent, regenerateAttendanceToken, updateEvent } from "@/lib/actions/events";
import { adminEvent } from "@/lib/data/admin";
import { siteUrl } from "@/lib/utils";

// Panel privado: render dinámico por petición, sin validación de navegación instantánea.
export const instant = false;

export const metadata = { title: "Editar evento" };

export default async function EditEventPage({ params, searchParams }: PageProps<"/admin/eventos/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const event = await adminEvent(Number(id));
  if (!event) notFound();
  const attendanceUrl = `${siteUrl()}/asistencia/${event.attendanceToken}`;
  const svg = await QRCode.toString(attendanceUrl, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#1c1917", light: "#ffffff" } });

  return (
    <>
      <PageHeader
        title={event.title}
        description={event.published ? undefined : "Borrador: no aparece en el sitio y el llamado a lista está deshabilitado."}
        actions={
          <>
            <Link href={`/admin/eventos/${event.id}/asistentes`} className={buttonCls.secondary}>
              <Users className="size-4" /> Asistentes
            </Link>
            {event.published && (
              <a href={`/eventos/${event.slug}`} target="_blank" className={buttonCls.secondary}>
                <ExternalLink className="size-4" /> Ver en el sitio
              </a>
            )}
          </>
        }
      />
      {sp.creado === "1" && (
        <p role="status" className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
          Evento creado. Ya puedes descargar o compartir su código QR.
        </p>
      )}

      <Card title="Código QR para el llamado a lista" className="mb-6 scroll-mt-6" actions={event.published ? <Badge tone="green">Activo</Badge> : <Badge tone="amber">Inactivo</Badge>}>
        <div id="qr" className="scroll-mt-6">
          <QrPanel svg={svg} url={attendanceUrl} pngHref={`/admin/qr/${event.id}`} fileName={`qr-${event.slug}.png`} title={event.title} />
          <form action={regenerateAttendanceToken} className="mt-4 border-t border-stone-100 pt-4">
            <input type="hidden" name="id" value={event.id} />
            <ConfirmSubmit variant="ghost" message="El código QR actual dejará de funcionar. ¿Generar uno nuevo?">
              Generar un nuevo código (invalida el actual)
            </ConfirmSubmit>
          </form>
        </div>
      </Card>

      <Card title="Datos del evento">
        <ActionForm action={updateEvent}>
          <input type="hidden" name="id" value={event.id} />
          <EventFields event={event} />
          <div className="mt-6 flex justify-end">
            <SubmitButton>Guardar cambios</SubmitButton>
          </div>
        </ActionForm>
      </Card>

      <form action={deleteEvent} className="mt-6 flex justify-end">
        <input type="hidden" name="id" value={event.id} />
        <ConfirmSubmit message="¿Eliminar este evento y todos sus registros de asistencia? Esta acción no se puede deshacer.">Eliminar evento</ConfirmSubmit>
      </form>
    </>
  );
}
