import { and, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { CalendarDays, MapPin } from "lucide-react";
import { db } from "@/db";
import { events } from "@/db/schema";
import { formatEventDate, formatTime } from "@/lib/dates";
import logo from "../../../../public/logo.png";
import { AttendanceForm } from "./attendance-form";

export const metadata: Metadata = {
  title: "Llamado a lista",
  robots: { index: false, follow: false },
};

export default function AttendancePage({ params }: PageProps<"/asistencia/[token]">) {
  return (
    <div className="min-h-dvh bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <Image src={logo} alt="" width={40} height={40} className="size-10 object-contain" />
            <span className="text-sm leading-tight font-extrabold">
              Emaús Cristo Rey Cali
              <span className="block text-xs font-semibold text-stone-500">Llamado a lista</span>
            </span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-4 py-8">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" />}>
          <AttendanceContent params={params} />
        </Suspense>
      </main>
    </div>
  );
}

async function AttendanceContent({ params }: { params: PageProps<"/asistencia/[token]">["params"] }) {
  const { token } = await params;
  const [event] =
    token.length <= 64
      ? await db
          .select({ title: events.title, startsAt: events.startsAt, location: events.location })
          .from(events)
          .where(and(eq(events.attendanceToken, token), eq(events.published, true)))
          .limit(1)
      : [];

  if (!event) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
        <h1 className="text-xl font-extrabold">Llamado a lista no disponible</h1>
        <p className="mt-2 text-stone-600">Este código QR no es válido o el evento ya no está activo. Consulta con el coordinador.</p>
        <Link href="/" className="mt-6 inline-block font-semibold text-brand-700 hover:underline">Ir al inicio</Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs sm:p-8">
      <p className="eyebrow">Llamado a lista</p>
      <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-balance">{event.title}</h1>
      <ul className="mt-3 space-y-1 text-sm text-stone-600">
        <li className="flex items-center gap-2">
          <CalendarDays className="size-4 text-brand-700" />
          <span>{formatEventDate(event.startsAt)}</span> · {formatTime(event.startsAt)}
        </li>
        {event.location && (
          <li className="flex items-center gap-2">
            <MapPin className="size-4 text-brand-700" /> {event.location}
          </li>
        )}
      </ul>
      <hr className="my-6 border-stone-200" />
      <AttendanceForm token={token} />
    </div>
  );
}
