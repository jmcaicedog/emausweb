import "server-only";
import { and, asc, count, desc, eq, gte, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  adminUsers,
  attendances,
  bannerSlides,
  eventRegistrationPayments,
  eventRegistrations,
  events,
  galleryItems,
  people,
  siteSettings,
  tools,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth/dal";

export async function adminSettings() {
  await requireAdmin();
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
  return row ?? null;
}

export async function adminSlides() {
  await requireAdmin();
  return db.select().from(bannerSlides).orderBy(asc(bannerSlides.sortOrder), asc(bannerSlides.id));
}

export async function adminGallery() {
  await requireAdmin();
  return db.select().from(galleryItems).orderBy(asc(galleryItems.sortOrder), asc(galleryItems.id));
}

export async function adminTools() {
  await requireAdmin();
  return db.select().from(tools).orderBy(asc(tools.sortOrder), asc(tools.id));
}

export async function adminUsersList() {
  await requireAdmin();
  return db
    .select({ id: adminUsers.id, name: adminUsers.name, email: adminUsers.email, createdAt: adminUsers.createdAt })
    .from(adminUsers)
    .orderBy(asc(adminUsers.name));
}

const attendeeCount = db
  .select({ eventId: attendances.eventId, total: count().as("attendee_total") })
  .from(attendances)
  .groupBy(attendances.eventId)
  .as("ac");

const specialRegistrationCount = db
  .select({ eventId: eventRegistrations.eventId, total: count().as("registration_total") })
  .from(eventRegistrations)
  .groupBy(eventRegistrations.eventId)
  .as("src");

export async function adminEvents(scope: "upcoming" | "past" | "all" = "all") {
  await requireAdmin();
  const now = new Date();
  const where = scope === "upcoming" ? gte(events.startsAt, new Date(now.getTime() - 12 * 3600 * 1000)) : undefined;
  const rows = await db
    .select({
      id: events.id,
      title: events.title,
      slug: events.slug,
      startsAt: events.startsAt,
      location: events.location,
      published: events.published,
      imageUrl: events.imageUrl,
      attendees: attendeeCount.total,
      isSpecial: events.isSpecial,
      registrations: specialRegistrationCount.total,
    })
    .from(events)
    .leftJoin(attendeeCount, eq(attendeeCount.eventId, events.id))
    .leftJoin(specialRegistrationCount, eq(specialRegistrationCount.eventId, events.id))
    .where(where)
    .orderBy(scope === "upcoming" ? asc(events.startsAt) : desc(events.startsAt))
    .limit(scope === "upcoming" ? 5 : 500);
  return rows.map((r) => ({
    ...r,
    attendees: Number(r.attendees ?? 0),
    registrations: Number(r.registrations ?? 0),
  }));
}

export async function adminEvent(id: number) {
  await requireAdmin();
  if (!Number.isInteger(id)) return null;
  const [row] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return row ?? null;
}

export async function eventAttendees(eventId: number) {
  await requireAdmin();
  return db
    .select({
      id: attendances.id,
      createdAt: attendances.createdAt,
      personId: people.id,
      documentNumber: people.documentNumber,
      fullName: people.fullName,
      phone: people.phone,
      birthDate: people.birthDate,
    })
    .from(attendances)
    .innerJoin(people, eq(people.id, attendances.personId))
    .where(eq(attendances.eventId, eventId))
    .orderBy(asc(attendances.createdAt));
}

export async function eventSpecialRegistrations(eventId: number) {
  await requireAdmin();
  const registrations = await db
    .select({
      id: eventRegistrations.id,
      personId: people.id,
      documentNumber: people.documentNumber,
      fullName: people.fullName,
      phone: people.phone,
      birthDate: people.birthDate,
      companions: eventRegistrations.companions,
      amountDue: eventRegistrations.amountDue,
      attendanceToken: eventRegistrations.attendanceToken,
      checkedInAt: eventRegistrations.checkedInAt,
      createdAt: eventRegistrations.createdAt,
      amountPaid: sql<number>`coalesce(sum(${eventRegistrationPayments.amount}), 0)`.mapWith(Number),
    })
    .from(eventRegistrations)
    .innerJoin(people, eq(people.id, eventRegistrations.personId))
    .leftJoin(eventRegistrationPayments, eq(eventRegistrationPayments.registrationId, eventRegistrations.id))
    .where(eq(eventRegistrations.eventId, eventId))
    .groupBy(eventRegistrations.id, people.id)
    .orderBy(asc(people.fullName));

  if (registrations.length === 0) return [];
  const payments = await db
    .select({
      id: eventRegistrationPayments.id,
      registrationId: eventRegistrationPayments.registrationId,
      amount: eventRegistrationPayments.amount,
      createdAt: eventRegistrationPayments.createdAt,
      adminName: adminUsers.name,
    })
    .from(eventRegistrationPayments)
    .innerJoin(adminUsers, eq(adminUsers.id, eventRegistrationPayments.adminUserId))
    .where(inArray(eventRegistrationPayments.registrationId, registrations.map((registration) => registration.id)))
    .orderBy(desc(eventRegistrationPayments.createdAt));
  const paymentsByRegistration = new Map<number, typeof payments>();
  for (const payment of payments) {
    const list = paymentsByRegistration.get(payment.registrationId) ?? [];
    list.push(payment);
    paymentsByRegistration.set(payment.registrationId, list);
  }
  return registrations.map((registration) => ({
    ...registration,
    amountPaid: Number(registration.amountPaid),
    payments: paymentsByRegistration.get(registration.id) ?? [],
  }));
}

export async function specialRegistrationByToken(token: string) {
  await requireAdmin();
  if (!token || token.length > 64) return null;
  const [registration] = await db
    .select({
      id: eventRegistrations.id,
      eventId: events.id,
      eventTitle: events.title,
      personName: people.fullName,
      companions: eventRegistrations.companions,
      checkedInAt: eventRegistrations.checkedInAt,
    })
    .from(eventRegistrations)
    .innerJoin(events, eq(events.id, eventRegistrations.eventId))
    .innerJoin(people, eq(people.id, eventRegistrations.personId))
    .where(eq(eventRegistrations.attendanceToken, token))
    .limit(1);
  return registration ?? null;
}

export async function adminPeople(q: string) {
  await requireAdmin();
  const term = q.trim();
  const attCount = db
    .select({ personId: attendances.personId, total: count().as("total") })
    .from(attendances)
    .groupBy(attendances.personId)
    .as("pc");
  const rows = await db
    .select({
      id: people.id,
      documentNumber: people.documentNumber,
      fullName: people.fullName,
      phone: people.phone,
      birthDate: people.birthDate,
      total: attCount.total,
    })
    .from(people)
    .leftJoin(attCount, eq(attCount.personId, people.id))
    .where(term ? or(ilike(people.fullName, `%${term}%`), ilike(people.documentNumber, `%${term}%`), ilike(people.phone, `%${term}%`)) : undefined)
    .orderBy(asc(people.fullName))
    .limit(300);
  return rows.map((r) => ({ ...r, total: Number(r.total ?? 0) }));
}

export async function adminBirthdays() {
  await requireAdmin();
  return db
    .select({ id: people.id, fullName: people.fullName, birthDate: people.birthDate })
    .from(people)
    .orderBy(asc(people.fullName));
}

export async function adminPerson(id: number) {
  await requireAdmin();
  if (!Number.isInteger(id)) return null;
  const [person] = await db.select().from(people).where(eq(people.id, id)).limit(1);
  if (!person) return null;
  const history = await db
    .select({ eventId: events.id, title: events.title, startsAt: events.startsAt, registeredAt: attendances.createdAt })
    .from(attendances)
    .innerJoin(events, eq(events.id, attendances.eventId))
    .where(and(eq(attendances.personId, id)))
    .orderBy(desc(events.startsAt));
  return { person, history };
}

export async function dashboardStats() {
  await requireAdmin();
  const [[e], [p], [a]] = await Promise.all([
    db.select({ n: count() }).from(events),
    db.select({ n: count() }).from(people),
    db.select({ n: count() }).from(attendances),
  ]);
  return { events: e.n, people: p.n, attendances: a.n };
}
