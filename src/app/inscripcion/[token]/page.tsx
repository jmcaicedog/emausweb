import { and, eq, gt } from "drizzle-orm";
import { CalendarDays, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/db";
import { events } from "@/db/schema";
import { formatEventDate, formatTime } from "@/lib/dates";
import logo from "../../../../public/logo.png";
import { SpecialRegistrationForm } from "./registration-form";

export const instant = false;

export const metadata: Metadata = {
  title: "Inscripción a evento",
  robots: { index: false, follow: false },
};

export default function SpecialRegistrationPage({ params }: PageProps<"/inscripcion/[token]">) {
  return (
    <div className="min-h-dvh bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <Image src={logo} alt="" width={40} height={40} className="size-10 object-contain" />
            <span className="text-sm leading-tight font-extrabold">
              Emaús Cristo Rey Cali
              <span className="block text-xs font-semibold text-stone-500">Inscripción a evento</span>
            </span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-4 py-8">
        <RegistrationContent params={params} />
      </main>
    </div>
  );
}

async function RegistrationContent({ params }: { params: PageProps<"/inscripcion/[token]">["params"] }) {
  const { token } = await params;
  const [event] = token.length <= 64
    ? await db
        .select({
          id: events.id,
          title: events.title,
          description: events.description,
          imageUrl: events.imageUrl,
          startsAt: events.startsAt,
          location: events.location,
          pricePerPerson: events.pricePerPerson,
        })
        .from(events)
        .where(and(
          eq(events.registrationToken, token),
          eq(events.isSpecial, true),
          eq(events.published, true),
          gt(events.startsAt, new Date()),
        ))
        .limit(1)
    : [];

  if (!event) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
        <h1 className="text-xl font-extrabold">Inscripción no disponible</h1>
        <p className="mt-2 text-stone-600">El enlace no es válido o el periodo de inscripción terminó.</p>
        <Link href="/" className="mt-6 inline-block font-semibold text-brand-700 hover:underline">Ir al sitio</Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xs">
      {event.imageUrl && (
        <div className="relative aspect-[16/9] bg-stone-100">
          <Image src={event.imageUrl} alt={event.title} fill sizes="(max-width: 640px) 100vw, 576px" className="object-cover" />
        </div>
      )}
      <div className="p-6 sm:p-8">
        <p className="eyebrow">Inscripción requerida</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-balance">{event.title}</h1>
        {event.description && <p className="mt-3 whitespace-pre-line text-stone-600">{event.description}</p>}
        <ul className="mt-4 space-y-2 text-sm text-stone-600">
          <li className="flex items-center gap-2"><CalendarDays className="size-4 text-brand-700" />{formatEventDate(event.startsAt)} · {formatTime(event.startsAt)}</li>
          {event.location && <li className="flex items-center gap-2"><MapPin className="size-4 text-brand-700" />{event.location}</li>}
        </ul>
        <p className="mt-5 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-900">
          Precio por persona:{" "}
          <strong>{new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(event.pricePerPerson)}</strong>
          <span className="block mt-1 text-brand-800">El total incluye tu inscripción y el número de acompañantes que indiques.</span>
        </p>
        <hr className="my-6 border-stone-200" />
        <SpecialRegistrationForm token={token} pricePerPerson={event.pricePerPerson} />
      </div>
    </div>
  );
}
