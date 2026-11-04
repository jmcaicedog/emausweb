"use server";

import { randomBytes } from "node:crypto";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { eventRegistrationPayments, eventRegistrations, events, people } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/dal";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { fromError, str } from "./helpers";
import type { ActionState } from "./types";

const documentSchema = z.string().regex(/^[0-9A-Za-z]{4,15}$/, "Número de documento no válido");
const personSchema = z.object({
  documentNumber: documentSchema,
  fullName: z.string().min(5, "Escribe tu nombre completo").max(160).regex(/^[\p{L}\s'.-]+$/u, "Solo letras y espacios"),
  phone: z.string().regex(/^\+?\d{7,15}$/, "Teléfono no válido (solo números)"),
  birthDate: z.iso.date("Fecha no válida").refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return date.getUTCFullYear() >= 1900 && date.getTime() < Date.now();
  }, "Fecha de nacimiento no válida"),
  companions: z.number().int().min(0).max(2_147_483_647),
  consent: z.literal(true, { error: "Debes autorizar el tratamiento de datos" }),
});

export type SpecialLookupResult =
  | { status: "found"; fullName: string; phone: string; birthDate: string; alreadyRegistered: boolean }
  | { status: "new" }
  | { status: "error"; message: string };

export type SpecialRegistrationState = {
  status?: "ok" | "duplicate" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  name?: string;
  attendanceToken?: string;
  amountDue?: number;
};

async function openSpecialEvent(token: string) {
  if (!token || token.length > 64) return null;
  const [event] = await db
    .select({
      id: events.id,
      title: events.title,
      pricePerPerson: events.pricePerPerson,
    })
    .from(events)
    .where(and(
      eq(events.registrationToken, token),
      eq(events.isSpecial, true),
      eq(events.published, true),
      gt(events.startsAt, new Date()),
    ))
    .limit(1);
  return event ?? null;
}

export async function lookupSpecialPerson(token: string, document: string): Promise<SpecialLookupResult> {
  const parsedDocument = documentSchema.safeParse(document.trim());
  if (!parsedDocument.success) return { status: "error", message: "Número de documento no válido." };
  const ip = await clientIp();
  if (!(await rateLimit(`special-lookup:${ip}`, 30, 10 * 60))) {
    return { status: "error", message: "Demasiadas consultas. Espera unos minutos." };
  }
  const event = await openSpecialEvent(token);
  if (!event) return { status: "error", message: "La inscripción no está disponible." };
  const [person] = await db
    .select({ id: people.id, fullName: people.fullName, phone: people.phone, birthDate: people.birthDate })
    .from(people)
    .where(eq(people.documentNumber, parsedDocument.data))
    .limit(1);
  if (!person) return { status: "new" };
  const [registration] = await db
    .select({ id: eventRegistrations.id })
    .from(eventRegistrations)
    .where(and(eq(eventRegistrations.eventId, event.id), eq(eventRegistrations.personId, person.id)))
    .limit(1);
  return {
    status: "found",
    fullName: person.fullName,
    phone: person.phone,
    birthDate: person.birthDate,
    alreadyRegistered: !!registration,
  };
}

export async function registerSpecialEvent(_: SpecialRegistrationState, fd: FormData): Promise<SpecialRegistrationState> {
  if (str(fd, "website")) return { status: "ok", message: "Inscripción recibida." };
  const parsed = personSchema.safeParse({
    documentNumber: str(fd, "documentNumber"),
    fullName: str(fd, "fullName").replace(/\s+/g, " "),
    phone: str(fd, "phone").replace(/[\s()-]/g, ""),
    birthDate: str(fd, "birthDate"),
    companions: Number(str(fd, "companions")),
    consent: fd.get("consent") === "on",
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisa los campos marcados.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const ip = await clientIp();
  if (!(await rateLimit(`special-register:${ip}`, 20, 10 * 60))) {
    return { status: "error", message: "Demasiadas inscripciones desde esta conexión. Espera unos minutos." };
  }
  const token = str(fd, "token");
  const event = await openSpecialEvent(token);
  if (!event) return { status: "error", message: "La inscripción no está disponible." };

  const { documentNumber, fullName, phone, birthDate, companions } = parsed.data;
  const amountDue = event.pricePerPerson * (companions + 1);
  if (!Number.isSafeInteger(amountDue) || amountDue > 2_020_000_000) {
    return {
      status: "error",
      message: "El número de personas supera el máximo permitido por el valor total. Revisa los acompañantes.",
      fieldErrors: { companions: ["El total supera el valor máximo que se puede registrar."] },
    };
  }
  try {
    const result = await db.transaction(async (tx) => {
      const [existingPerson] = await tx
        .select({ id: people.id })
        .from(people)
        .where(eq(people.documentNumber, documentNumber))
        .limit(1);
      if (existingPerson) {
        const [existingRegistration] = await tx
          .select({ id: eventRegistrations.id })
          .from(eventRegistrations)
          .where(and(eq(eventRegistrations.eventId, event.id), eq(eventRegistrations.personId, existingPerson.id)))
          .limit(1);
        if (existingRegistration) return { duplicate: true as const };
      }

      const [person] = await tx
        .insert(people)
        .values({ documentNumber, fullName, phone, birthDate, consentAt: new Date() })
        .onConflictDoUpdate({
          target: people.documentNumber,
          set: { fullName, phone, birthDate, consentAt: sql`now()`, updatedAt: sql`now()` },
        })
        .returning({ id: people.id });
      const attendanceToken = randomBytes(24).toString("base64url");
      const [registration] = await tx
        .insert(eventRegistrations)
        .values({ eventId: event.id, personId: person.id, companions, amountDue, attendanceToken })
        .onConflictDoNothing()
        .returning({ id: eventRegistrations.id });
      return registration ? { duplicate: false as const, attendanceToken } : { duplicate: true as const };
    });

    if (result.duplicate) {
      return { status: "duplicate", name: fullName.split(" ")[0], message: "Ya existe una inscripción para este documento en el evento." };
    }
    return {
      status: "ok",
      name: fullName.split(" ")[0],
      amountDue,
      attendanceToken: result.attendanceToken,
      message: "Tu inscripción quedó registrada.",
    };
  } catch (error) {
    return { status: "error", message: fromError(error).error };
  }
}

const paymentSchema = z.number().int().positive("El valor debe ser mayor que cero").max(2_020_000_000);

export async function addSpecialEventPayment(_: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const registrationId = Number(str(fd, "registrationId"));
  const amount = paymentSchema.safeParse(Number(str(fd, "amount")));
  if (!Number.isInteger(registrationId) || registrationId < 1) return { error: "Inscripción no válida." };
  if (!amount.success) return { error: amount.error.issues[0]?.message ?? "Valor de pago no válido." };

  try {
    const result = await db.transaction(async (tx) => {
      const [registration] = await tx
        .select({ id: eventRegistrations.id, amountDue: eventRegistrations.amountDue })
        .from(eventRegistrations)
        .where(eq(eventRegistrations.id, registrationId))
        .for("update");
      if (!registration) return "not-found" as const;
      const [paid] = await tx
        .select({ total: sql<number>`coalesce(sum(${eventRegistrationPayments.amount}), 0)`.mapWith(Number) })
        .from(eventRegistrationPayments)
        .where(eq(eventRegistrationPayments.registrationId, registrationId));
      if (Number(paid.total) + amount.data > registration.amountDue) return "overpayment" as const;
      await tx.insert(eventRegistrationPayments).values({
        registrationId,
        amount: amount.data,
        adminUserId: admin.id,
      });
      return "ok" as const;
    });

    if (result === "not-found") return { error: "Inscripción no encontrada." };
    if (result === "overpayment") return { error: "El abono supera el saldo pendiente." };
    refresh();
    return { ok: true, message: "Pago registrado." };
  } catch (error) {
    return fromError(error);
  }
}

export async function markSpecialEventAttendance(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const token = str(fd, "token");
  if (!token || token.length > 64) return { error: "Código de asistencia no válido." };
  try {
    const [registration] = await db
      .update(eventRegistrations)
      .set({ checkedInAt: new Date() })
      .where(and(eq(eventRegistrations.attendanceToken, token), isNull(eventRegistrations.checkedInAt)))
      .returning({ id: eventRegistrations.id });
    if (!registration) return { error: "Código no válido o asistencia ya registrada." };
    refresh();
    return { ok: true, message: "Asistencia del grupo registrada." };
  } catch (error) {
    return fromError(error);
  }
}
