import "server-only";
import { and, asc, eq, gte } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { bannerSlides, events, galleryItems, siteSettings, tools } from "@/db/schema";
import { startOfBogotaMonth } from "@/lib/dates";
import { TAGS } from "@/lib/tags";

export const DEFAULT_SETTINGS = {
  bannerEnabled: true,
  whatsappNumber: "",
  whatsappMessage: "",
  instagramUrl: "https://www.instagram.com/emauscristoreyhombresoficial/",
  address: "",
  phone: "",
  email: "",
  groupCoordinator: "",
  spiritualCoordinator: "",
  mapUrl: "",
  seoTitle: "Emaús Cristo Rey Cali",
  seoDescription: "Comunidad Emaús Hombres de la Parroquia Cristo Rey en Cali.",
};

export type PublicSettings = typeof DEFAULT_SETTINGS;

export async function getSettings(): Promise<PublicSettings> {
  "use cache";
  cacheTag(TAGS.settings);
  cacheLife("max");
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
  if (!row) return DEFAULT_SETTINGS;
  return {
    bannerEnabled: row.bannerEnabled,
    whatsappNumber: row.whatsappNumber,
    whatsappMessage: row.whatsappMessage,
    instagramUrl: row.instagramUrl || DEFAULT_SETTINGS.instagramUrl,
    address: row.address,
    phone: row.phone,
    email: row.email,
    groupCoordinator: row.groupCoordinator,
    spiritualCoordinator: row.spiritualCoordinator,
    mapUrl: row.mapUrl,
    seoTitle: row.seoTitle || DEFAULT_SETTINGS.seoTitle,
    seoDescription: row.seoDescription || DEFAULT_SETTINGS.seoDescription,
  };
}

export async function getActiveSlides() {
  "use cache";
  cacheTag(TAGS.banner);
  cacheLife("max");
  return db
    .select({
      id: bannerSlides.id,
      imageUrl: bannerSlides.imageUrl,
      mobileImageUrl: bannerSlides.mobileImageUrl,
      title: bannerSlides.title,
      subtitle: bannerSlides.subtitle,
      ctaLabel: bannerSlides.ctaLabel,
      ctaUrl: bannerSlides.ctaUrl,
    })
    .from(bannerSlides)
    .where(eq(bannerSlides.active, true))
    .orderBy(asc(bannerSlides.sortOrder), asc(bannerSlides.id))
    .limit(3);
}

export async function getGallery() {
  "use cache";
  cacheTag(TAGS.gallery);
  cacheLife("max");
  return db
    .select({ id: galleryItems.id, imageUrl: galleryItems.imageUrl, alt: galleryItems.alt, postUrl: galleryItems.postUrl })
    .from(galleryItems)
    .orderBy(asc(galleryItems.sortOrder), asc(galleryItems.id))
    .limit(5);
}

export async function getActiveTools() {
  "use cache";
  cacheTag(TAGS.tools);
  cacheLife("max");
  return db
    .select({ id: tools.id, name: tools.name, description: tools.description, url: tools.url, iconUrl: tools.iconUrl })
    .from(tools)
    .where(eq(tools.active, true))
    .orderBy(asc(tools.sortOrder), asc(tools.id));
}

const publicEventFields = {
  id: events.id,
  slug: events.slug,
  title: events.title,
  description: events.description,
  imageUrl: events.imageUrl,
  startsAt: events.startsAt,
  endsAt: events.endsAt,
  location: events.location,
  mapUrl: events.mapUrl,
};

export type PublicEvent = {
  id: number;
  slug: string;
  title: string;
  description: string;
  imageUrl: string | null;
  startsAt: Date;
  endsAt: Date | null;
  location: string;
  mapUrl: string;
};

/** Eventos publicados desde el mes en curso (hora Bogotá) y el mes actual de referencia. */
export async function getCalendarEvents() {
  "use cache";
  cacheTag(TAGS.events);
  cacheLife("hours");
  const now = new Date();
  const from = startOfBogotaMonth(now, 0);
  const rows: PublicEvent[] = await db
    .select(publicEventFields)
    .from(events)
    .where(and(eq(events.published, true), gte(events.startsAt, from)))
    .orderBy(asc(events.startsAt))
    .limit(500);
  return { events: rows, monthStart: from.toISOString() };
}

export async function getEventBySlug(slug: string): Promise<PublicEvent | null> {
  "use cache";
  cacheTag(TAGS.events, TAGS.event(slug));
  cacheLife("max");
  const [row] = await db
    .select(publicEventFields)
    .from(events)
    .where(and(eq(events.slug, slug), eq(events.published, true)))
    .limit(1);
  return row ?? null;
}

export async function getPublishedEventSlugs() {
  "use cache";
  cacheTag(TAGS.events);
  cacheLife("hours");
  return db
    .select({ slug: events.slug, updatedAt: events.updatedAt, startsAt: events.startsAt })
    .from(events)
    .where(eq(events.published, true))
    .orderBy(asc(events.startsAt));
}

export async function getCurrentYear() {
  "use cache";
  cacheLife("days");
  return Number(new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "America/Bogota" }).format(new Date()));
}
