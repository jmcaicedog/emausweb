"use server";

import { count, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { bannerSlides, galleryItems, siteSettings, tools } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/dal";
import { deleteImage, hasFile, uploadImage } from "@/lib/storage";
import { TAGS } from "@/lib/tags";
import { bool, fromError, fromZod, int, str, zUrl } from "./helpers";
import type { ActionState } from "./types";

/* ---------- Configuración general ---------- */

const settingsSchema = z.object({
  whatsappNumber: z
    .string()
    .max(20)
    .refine((v) => v === "" || /^\d{8,15}$/.test(v), "Solo dígitos con indicativo de país, ej: 573001234567"),
  whatsappMessage: z.string().max(500),
  instagramUrl: zUrl,
  address: z.string().max(300),
  phone: z.string().max(40),
  email: z.union([z.literal(""), z.email("Correo no válido").max(254)]),
  groupCoordinator: z.string().max(160),
  spiritualCoordinator: z.string().max(160),
  mapUrl: zUrl,
  seoTitle: z.string().min(3, "Requerido").max(120),
  seoDescription: z.string().min(20, "Mínimo 20 caracteres").max(300),
  morningPrayer: z.string().max(4000),
  eveningPrayer: z.string().max(4000),
  gospelEnabled: z.boolean(),
  gospelChannelId: z.union([z.literal(""), z.string().regex(/^UC[\w-]{22}$/, "ID de canal no válido (empieza por UC y tiene 24 caracteres)")]),
  gospelKeyword: z.string().max(80),
});

export async function saveSettings(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse({
    whatsappNumber: str(fd, "whatsappNumber").replace(/\D/g, ""),
    whatsappMessage: str(fd, "whatsappMessage"),
    instagramUrl: str(fd, "instagramUrl"),
    address: str(fd, "address"),
    phone: str(fd, "phone"),
    email: str(fd, "email"),
    groupCoordinator: str(fd, "groupCoordinator"),
    spiritualCoordinator: str(fd, "spiritualCoordinator"),
    mapUrl: str(fd, "mapUrl"),
    seoTitle: str(fd, "seoTitle"),
    seoDescription: str(fd, "seoDescription"),
    morningPrayer: str(fd, "morningPrayer"),
    eveningPrayer: str(fd, "eveningPrayer"),
    gospelEnabled: bool(fd, "gospelEnabled"),
    gospelChannelId: str(fd, "gospelChannelId"),
    gospelKeyword: str(fd, "gospelKeyword"),
  });
  if (!parsed.success) return fromZod(parsed.error);
  await db
    .insert(siteSettings)
    .values({ id: 1, ...parsed.data })
    .onConflictDoUpdate({ target: siteSettings.id, set: { ...parsed.data, updatedAt: new Date() } });
  updateTag(TAGS.settings);
  return { ok: true, message: "Configuración guardada." };
}

export async function setBannerEnabled(fd: FormData) {
  await requireAdmin();
  const enabled = bool(fd, "enabled");
  await db
    .insert(siteSettings)
    .values({ id: 1, bannerEnabled: enabled })
    .onConflictDoUpdate({ target: siteSettings.id, set: { bannerEnabled: enabled, updatedAt: new Date() } });
  updateTag(TAGS.settings);
}

/* ---------- Banner ---------- */

const slideSchema = z.object({
  title: z.string().max(160),
  subtitle: z.string().max(300),
  ctaLabel: z.string().max(60),
  ctaUrl: zUrl,
  sortOrder: z.number().int().min(0).max(999),
  active: z.boolean(),
});

function slideInput(fd: FormData) {
  return slideSchema.safeParse({
    title: str(fd, "title"),
    subtitle: str(fd, "subtitle"),
    ctaLabel: str(fd, "ctaLabel"),
    ctaUrl: str(fd, "ctaUrl"),
    sortOrder: int(fd, "sortOrder"),
    active: bool(fd, "active"),
  });
}

export async function createSlide(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = slideInput(fd);
  if (!parsed.success) return fromZod(parsed.error);
  const [{ total }] = await db.select({ total: count() }).from(bannerSlides);
  if (total >= 3) return { error: "El banner admite máximo 3 diapositivas." };
  const image = fd.get("image");
  if (!hasFile(image)) return { error: "La imagen es obligatoria.", fieldErrors: { image: ["Selecciona una imagen"] } };
  try {
    const imageUrl = await uploadImage(image, "banner", 2400);
    const mobile = fd.get("mobileImage");
    const mobileImageUrl = hasFile(mobile) ? await uploadImage(mobile, "banner", 1200) : null;
    await db.insert(bannerSlides).values({ ...parsed.data, imageUrl, mobileImageUrl });
  } catch (e) {
    return fromError(e);
  }
  updateTag(TAGS.banner);
  return { ok: true, message: "Diapositiva creada." };
}

export async function updateSlide(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = int(fd, "id");
  const parsed = slideInput(fd);
  if (!parsed.success) return fromZod(parsed.error);
  const [current] = await db.select().from(bannerSlides).where(eq(bannerSlides.id, id)).limit(1);
  if (!current) return { error: "Diapositiva no encontrada." };
  try {
    const values: Partial<typeof bannerSlides.$inferInsert> = { ...parsed.data, updatedAt: new Date() };
    const image = fd.get("image");
    if (hasFile(image)) values.imageUrl = await uploadImage(image, "banner", 2400);
    const mobile = fd.get("mobileImage");
    if (hasFile(mobile)) values.mobileImageUrl = await uploadImage(mobile, "banner", 1200);
    else if (bool(fd, "mobileImageRemove")) values.mobileImageUrl = null;
    await db.update(bannerSlides).set(values).where(eq(bannerSlides.id, id));
    if (values.imageUrl) await deleteImage(current.imageUrl);
    if (values.mobileImageUrl !== undefined) await deleteImage(current.mobileImageUrl);
  } catch (e) {
    return fromError(e);
  }
  updateTag(TAGS.banner);
  return { ok: true, message: "Diapositiva actualizada." };
}

export async function deleteSlide(fd: FormData) {
  await requireAdmin();
  const id = int(fd, "id");
  const [row] = await db.delete(bannerSlides).where(eq(bannerSlides.id, id)).returning();
  if (row) {
    await deleteImage(row.imageUrl);
    await deleteImage(row.mobileImageUrl);
  }
  updateTag(TAGS.banner);
}

/* ---------- Galería Instagram ---------- */

const gallerySchema = z.object({
  alt: z.string().max(300),
  postUrl: zUrl,
  sortOrder: z.number().int().min(0).max(999),
});

export async function createGalleryItem(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = gallerySchema.safeParse({ alt: str(fd, "alt"), postUrl: str(fd, "postUrl"), sortOrder: int(fd, "sortOrder") });
  if (!parsed.success) return fromZod(parsed.error);
  const [{ total }] = await db.select({ total: count() }).from(galleryItems);
  if (total >= 5) return { error: "La galería admite máximo 5 imágenes. Elimina una para agregar otra." };
  const image = fd.get("image");
  if (!hasFile(image)) return { error: "La imagen es obligatoria." };
  try {
    const imageUrl = await uploadImage(image, "galeria", 1080);
    await db.insert(galleryItems).values({ ...parsed.data, imageUrl });
  } catch (e) {
    return fromError(e);
  }
  updateTag(TAGS.gallery);
  return { ok: true, message: "Imagen agregada." };
}

export async function updateGalleryItem(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = int(fd, "id");
  const parsed = gallerySchema.safeParse({ alt: str(fd, "alt"), postUrl: str(fd, "postUrl"), sortOrder: int(fd, "sortOrder") });
  if (!parsed.success) return fromZod(parsed.error);
  const [current] = await db.select().from(galleryItems).where(eq(galleryItems.id, id)).limit(1);
  if (!current) return { error: "Imagen no encontrada." };
  try {
    const image = fd.get("image");
    const imageUrl = hasFile(image) ? await uploadImage(image, "galeria", 1080) : undefined;
    await db.update(galleryItems).set({ ...parsed.data, ...(imageUrl ? { imageUrl } : {}), updatedAt: new Date() }).where(eq(galleryItems.id, id));
    if (imageUrl) await deleteImage(current.imageUrl);
  } catch (e) {
    return fromError(e);
  }
  updateTag(TAGS.gallery);
  return { ok: true, message: "Imagen actualizada." };
}

export async function deleteGalleryItem(fd: FormData) {
  await requireAdmin();
  const [row] = await db.delete(galleryItems).where(eq(galleryItems.id, int(fd, "id"))).returning();
  if (row) await deleteImage(row.imageUrl);
  updateTag(TAGS.gallery);
}

/* ---------- Herramientas ---------- */

const toolSchema = z.object({
  name: z.string().min(2, "Requerido").max(120),
  description: z.string().max(300),
  url: zUrl.refine((v) => v.length > 0, "Requerido"),
  sortOrder: z.number().int().min(0).max(999),
  active: z.boolean(),
});

function toolInput(fd: FormData) {
  return toolSchema.safeParse({
    name: str(fd, "name"),
    description: str(fd, "description"),
    url: str(fd, "url"),
    sortOrder: int(fd, "sortOrder"),
    active: bool(fd, "active"),
  });
}

export async function createTool(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = toolInput(fd);
  if (!parsed.success) return fromZod(parsed.error);
  try {
    const icon = fd.get("icon");
    const iconUrl = hasFile(icon) ? await uploadImage(icon, "herramientas", 256) : null;
    await db.insert(tools).values({ ...parsed.data, iconUrl });
  } catch (e) {
    return fromError(e);
  }
  updateTag(TAGS.tools);
  return { ok: true, message: "Herramienta creada." };
}

export async function updateTool(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = int(fd, "id");
  const parsed = toolInput(fd);
  if (!parsed.success) return fromZod(parsed.error);
  const [current] = await db.select().from(tools).where(eq(tools.id, id)).limit(1);
  if (!current) return { error: "Herramienta no encontrada." };
  try {
    const icon = fd.get("icon");
    let iconUrl: string | null | undefined;
    if (hasFile(icon)) iconUrl = await uploadImage(icon, "herramientas", 256);
    else if (bool(fd, "iconRemove")) iconUrl = null;
    await db.update(tools).set({ ...parsed.data, ...(iconUrl !== undefined ? { iconUrl } : {}), updatedAt: new Date() }).where(eq(tools.id, id));
    if (iconUrl !== undefined) await deleteImage(current.iconUrl);
  } catch (e) {
    return fromError(e);
  }
  updateTag(TAGS.tools);
  return { ok: true, message: "Herramienta actualizada." };
}

export async function deleteTool(fd: FormData) {
  await requireAdmin();
  const [row] = await db.delete(tools).where(eq(tools.id, int(fd, "id"))).returning();
  if (row) await deleteImage(row.iconUrl);
  updateTag(TAGS.tools);
}
