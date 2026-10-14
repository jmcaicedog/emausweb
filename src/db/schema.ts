import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 254 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  ...timestamps,
});

export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  bannerEnabled: boolean("banner_enabled").notNull().default(true),
  whatsappNumber: varchar("whatsapp_number", { length: 20 }).notNull().default(""),
  whatsappMessage: text("whatsapp_message").notNull().default(""),
  instagramUrl: text("instagram_url").notNull().default(""),
  address: text("address").notNull().default(""),
  phone: varchar("phone", { length: 40 }).notNull().default(""),
  email: varchar("email", { length: 254 }).notNull().default(""),
  groupCoordinator: varchar("group_coordinator", { length: 160 }).notNull().default(""),
  spiritualCoordinator: varchar("spiritual_coordinator", { length: 160 }).notNull().default(""),
  mapUrl: text("map_url").notNull().default(""),
  seoTitle: varchar("seo_title", { length: 120 }).notNull().default(""),
  seoDescription: varchar("seo_description", { length: 300 }).notNull().default(""),
  morningPrayer: text("morning_prayer").notNull().default(""),
  eveningPrayer: text("evening_prayer").notNull().default(""),
  gospelEnabled: boolean("gospel_enabled").notNull().default(true),
  gospelChannelId: varchar("gospel_channel_id", { length: 40 }).notNull().default("UCP9NtaODIi1Fr4mCZa1ahow"),
  gospelKeyword: varchar("gospel_keyword", { length: 80 }).notNull().default("EVANGELIO DE HOY"),
  ...timestamps,
});

export const bannerSlides = pgTable("banner_slides", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  mobileImageUrl: text("mobile_image_url"),
  title: varchar("title", { length: 160 }).notNull().default(""),
  subtitle: varchar("subtitle", { length: 300 }).notNull().default(""),
  ctaLabel: varchar("cta_label", { length: 60 }).notNull().default(""),
  ctaUrl: text("cta_url").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

export const galleryItems = pgTable("gallery_items", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  alt: varchar("alt", { length: 300 }).notNull().default(""),
  postUrl: text("post_url").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

export const tools = pgTable("tools", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  description: varchar("description", { length: 300 }).notNull().default(""),
  url: text("url").notNull(),
  iconUrl: text("icon_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

export const events = pgTable(
  "events",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 180 }).notNull().unique(),
    title: varchar("title", { length: 160 }).notNull(),
    description: text("description").notNull().default(""),
    imageUrl: text("image_url"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    location: varchar("location", { length: 300 }).notNull().default(""),
    mapUrl: text("map_url").notNull().default(""),
    published: boolean("published").notNull().default(false),
    attendanceToken: varchar("attendance_token", { length: 64 }).notNull().unique(),
    ...timestamps,
  },
  (t) => [index("events_starts_at_idx").on(t.startsAt)],
);

export const people = pgTable("people", {
  id: serial("id").primaryKey(),
  documentNumber: varchar("document_number", { length: 20 }).notNull().unique(),
  fullName: varchar("full_name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  birthDate: date("birth_date", { mode: "string" }).notNull(),
  consentAt: timestamp("consent_at", { withTimezone: true }).notNull(),
  ...timestamps,
});

export const attendances = pgTable(
  "attendances",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    personId: integer("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("attendances_event_person_uq").on(t.eventId, t.personId),
    index("attendances_person_idx").on(t.personId),
  ],
);

export const rateLimits = pgTable("rate_limits", {
  key: varchar("key", { length: 200 }).primaryKey(),
  count: integer("count").notNull().default(0),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
});

export type Event = typeof events.$inferSelect;
export type BannerSlide = typeof bannerSlides.$inferSelect;
export type GalleryItem = typeof galleryItems.$inferSelect;
export type Tool = typeof tools.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type Person = typeof people.$inferSelect;
