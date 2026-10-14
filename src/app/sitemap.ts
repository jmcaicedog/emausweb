import type { MetadataRoute } from "next";
import { getPublishedEventSlugs } from "@/lib/data/public";
import { siteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const list = await getPublishedEventSlugs();
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    ...list.map((e) => ({ url: `${base}/eventos/${e.slug}`, lastModified: e.updatedAt, changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: `${base}/privacidad`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
