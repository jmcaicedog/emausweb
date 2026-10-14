"use server";

import { randomBytes } from "node:crypto";
import { and, eq, ne } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { events } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/dal";
import { parseLocalDateTime } from "@/lib/dates";
import { deleteImage, hasFile, uploadImage } from "@/lib/storage";
import { TAGS } from "@/lib/tags";
import { slugify } from "@/lib/utils";
import { bool, fromError, fromZod, int, str, zUrl } from "./helpers";
import type { ActionState } from "./types";

function newAttendanceToken() {
  return randomBytes(18).toString("base64url");
}

const eventSchema = z
  .object({
    title: z.string().min(3, "Mínimo 3 caracteres").max(160),
    slug: z.string().max(150),
    description: z.string().max(5000),
    startsAt: z.date({ error: "Fecha de inicio no válida" }),
    endsAt: z.date().nullable(),
    location: z.string().max(300),
    mapUrl: zUrl,
    published: z.boolean(),
  })
  .refine((v) => !v.endsAt || v.endsAt >= v.startsAt, { message: "La hora de fin debe ser posterior al inicio", path: ["endsAt"] });

function eventInput(fd: FormData) {
  return eventSchema.safeParse({
    title: str(fd, "title"),
    slug: slugify(str(fd, "slug") || str(fd, "title")),
    description: str(fd, "description"),
    startsAt: parseLocalDateTime(str(fd, "startsAt")) ?? undefined,
    endsAt: parseLocalDateTime(str(fd, "endsAt")),
    location: str(fd, "location"),
    mapUrl: str(fd, "mapUrl"),
    published: bool(fd, "published"),
  });
}

async function uniqueSlug(base: string, excludeId?: number) {
  const root = base || "evento";
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const where = excludeId ? and(eq(events.slug, candidate), ne(events.id, excludeId)) : eq(events.slug, candidate);
    const [hit] = await db.select({ id: events.id }).from(events).where(where).limit(1);
    if (!hit) return candidate;
  }
  return `${root}-${randomBytes(3).toString("hex")}`;
}

export async function createEvent(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = eventInput(fd);
  if (!parsed.success) return fromZod(parsed.error);
  let id: number;
  try {
    const image = fd.get("image");
    const imageUrl = hasFile(image) ? await uploadImage(image, "eventos", 1600) : null;
    const slug = await uniqueSlug(parsed.data.slug);
    const [row] = await db
      .insert(events)
      .values({ ...parsed.data, slug, imageUrl, attendanceToken: newAttendanceToken() })
      .returning({ id: events.id });
    id = row.id;
  } catch (e) {
    return fromError(e);
  }
  updateTag(TAGS.events);
  redirect(`/admin/eventos/${id}?creado=1`);
}

export async function updateEvent(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = int(fd, "id");
  const parsed = eventInput(fd);
  if (!parsed.success) return fromZod(parsed.error);
  const [current] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!current) return { error: "Evento no encontrado." };
  try {
    const image = fd.get("image");
    let imageUrl: string | null | undefined;
    if (hasFile(image)) imageUrl = await uploadImage(image, "eventos", 1600);
    else if (bool(fd, "imageRemove")) imageUrl = null;
    const slug = await uniqueSlug(parsed.data.slug, id);
    await db
      .update(events)
      .set({ ...parsed.data, slug, ...(imageUrl !== undefined ? { imageUrl } : {}), updatedAt: new Date() })
      .where(eq(events.id, id));
    if (imageUrl !== undefined) await deleteImage(current.imageUrl);
    updateTag(TAGS.events);
    updateTag(TAGS.event(current.slug));
    if (slug !== current.slug) updateTag(TAGS.event(slug));
  } catch (e) {
    return fromError(e);
  }
  return { ok: true, message: "Evento actualizado." };
}

export async function deleteEvent(fd: FormData) {
  await requireAdmin();
  const [row] = await db.delete(events).where(eq(events.id, int(fd, "id"))).returning();
  if (row) {
    await deleteImage(row.imageUrl);
    updateTag(TAGS.events);
    updateTag(TAGS.event(row.slug));
  }
  redirect("/admin/eventos");
}

export async function regenerateAttendanceToken(fd: FormData) {
  await requireAdmin();
  const id = int(fd, "id");
  await db.update(events).set({ attendanceToken: newAttendanceToken() }).where(eq(events.id, id));
  refresh();
}
