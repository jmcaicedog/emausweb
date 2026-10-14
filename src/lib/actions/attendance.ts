"use server";

import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { attendances, events, people } from "@/db/schema";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { str } from "./helpers";

const docSchema = z.string().regex(/^[0-9A-Za-z]{4,15}$/, "Número de documento no válido");

async function openEvent(token: string) {
  if (!token || token.length > 64) return null;
  const [ev] = await db
    .select({ id: events.id })
    .from(events)
    .where(and(eq(events.attendanceToken, token), eq(events.published, true)))
    .limit(1);
  return ev ?? null;
}

export type LookupResult =
  | { status: "found"; fullName: string; phone: string; birthDate: string; alreadyRegistered: boolean }
  | { status: "new" }
  | { status: "error"; message: string };

export async function lookupPerson(token: string, document: string): Promise<LookupResult> {
  const doc = docSchema.safeParse(document.trim());
  if (!doc.success) return { status: "error", message: "Número de documento no válido." };
  const ip = await clientIp();
  if (!(await rateLimit(`lookup:${ip}`, 30, 10 * 60))) {
    return { status: "error", message: "Demasiadas consultas. Espera unos minutos." };
  }
  const ev = await openEvent(token);
  if (!ev) return { status: "error", message: "El llamado a lista no está disponible." };
  const [person] = await db.select().from(people).where(eq(people.documentNumber, doc.data)).limit(1);
  if (!person) return { status: "new" };
  const [att] = await db
    .select({ id: attendances.id })
    .from(attendances)
    .where(and(eq(attendances.eventId, ev.id), eq(attendances.personId, person.id)))
    .limit(1);
  return { status: "found", fullName: person.fullName, phone: person.phone, birthDate: person.birthDate, alreadyRegistered: !!att };
}

const registerSchema = z.object({
  documentNumber: docSchema,
  fullName: z
    .string()
    .min(5, "Escribe tu nombre completo")
    .max(160)
    .regex(/^[\p{L}\s'.-]+$/u, "Solo letras y espacios"),
  phone: z.string().regex(/^\+?\d{7,15}$/, "Teléfono no válido (solo números)"),
  birthDate: z.iso.date("Fecha no válida").refine((v) => {
    const d = new Date(`${v}T00:00:00Z`);
    const year = d.getUTCFullYear();
    return year >= 1900 && d.getTime() < Date.now();
  }, "Fecha de nacimiento no válida"),
  consent: z.literal(true, { error: "Debes autorizar el tratamiento de datos" }),
});

export type RegisterState = {
  status?: "ok" | "duplicate" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  name?: string;
};

export async function registerAttendance(_: RegisterState, fd: FormData): Promise<RegisterState> {
  if (str(fd, "website")) return { status: "ok", message: "Registro recibido." };
  const token = str(fd, "token");
  const parsed = registerSchema.safeParse({
    documentNumber: str(fd, "documentNumber"),
    fullName: str(fd, "fullName").replace(/\s+/g, " "),
    phone: str(fd, "phone").replace(/[\s()-]/g, ""),
    birthDate: str(fd, "birthDate"),
    consent: fd.get("consent") === "on",
  });
  if (!parsed.success) {
    return { status: "error", message: "Revisa los campos marcados.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const ip = await clientIp();
  if (!(await rateLimit(`register:${ip}`, 40, 10 * 60))) {
    return { status: "error", message: "Demasiados registros desde esta conexión. Espera unos minutos." };
  }
  const ev = await openEvent(token);
  if (!ev) return { status: "error", message: "El llamado a lista no está disponible." };

  const { documentNumber, fullName, phone, birthDate } = parsed.data;
  const inserted = await db.transaction(async (tx) => {
    const [person] = await tx
      .insert(people)
      .values({ documentNumber, fullName, phone, birthDate, consentAt: new Date() })
      .onConflictDoUpdate({
        target: people.documentNumber,
        set: { fullName, phone, birthDate, consentAt: sql`now()`, updatedAt: sql`now()` },
      })
      .returning({ id: people.id });
    return tx.insert(attendances).values({ eventId: ev.id, personId: person.id }).onConflictDoNothing().returning({ id: attendances.id });
  });

  const firstName = fullName.split(" ")[0];
  if (inserted.length === 0) {
    return { status: "duplicate", name: firstName, message: "Ya estabas registrado en este llamado a lista." };
  }
  return { status: "ok", name: firstName, message: "¡Asistencia registrada!" };
}
