import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/admin/form";
import { Card, PageHeader } from "@/components/admin/ui";
import { markSpecialEventAttendance } from "@/lib/actions/special-events";
import { specialRegistrationByToken } from "@/lib/data/admin";
import { formatDateTime } from "@/lib/dates";

export const instant = false;

export const metadata = { title: "Asistencia del grupo" };

export default async function SpecialAttendancePage({ params }: PageProps<"/admin/asistencia-especial/[token]">) {
  const { token } = await params;
  const registration = await specialRegistrationByToken(token);
  if (!registration) notFound();

  return (
    <>
      <Link href={`/admin/eventos/${registration.eventId}/inscripciones`} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-stone-600 hover:text-brand-700">
        <ArrowLeft className="size-4" /> Inscripciones
      </Link>
      <PageHeader title="Asistencia del grupo" description={registration.eventTitle} />
      <Card>
        <p className="text-lg font-extrabold">{registration.personName}</p>
        <p className="mt-1 text-sm text-stone-600">{registration.companions + 1} personas en el grupo (titular y {registration.companions} acompañantes).</p>
        {registration.checkedInAt ? (
          <p role="status" className="mt-5 flex items-center gap-2 rounded-lg bg-green-50 p-4 text-sm font-bold text-green-800">
            <CheckCircle2 className="size-5" /> Asistencia registrada el {formatDateTime(registration.checkedInAt)}.
          </p>
        ) : (
          <ActionForm action={markSpecialEventAttendance} className="mt-5">
            <input type="hidden" name="token" value={token} />
            <SubmitButton>Marcar asistencia del grupo</SubmitButton>
          </ActionForm>
        )}
      </Card>
    </>
  );
}
