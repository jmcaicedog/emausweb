import { EventFields } from "@/components/admin/event-fields";
import { ActionForm, SubmitButton } from "@/components/admin/form";
import { Card, PageHeader } from "@/components/admin/ui";
import { createEvent } from "@/lib/actions/events";

// Panel privado: render dinámico por petición, sin validación de navegación instantánea.
export const instant = false;

export const metadata = { title: "Nuevo evento" };

export default function NewEventPage() {
  return (
    <>
      <PageHeader title="Nuevo evento" description="Al guardarlo se genera el código QR de inscripción o de asistencia según el tipo de evento." />
      <Card>
        <ActionForm action={createEvent}>
          <EventFields />
          <div className="mt-6 flex justify-end">
            <SubmitButton>Crear evento</SubmitButton>
          </div>
        </ActionForm>
      </Card>
    </>
  );
}
