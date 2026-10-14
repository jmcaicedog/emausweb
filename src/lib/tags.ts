export const TAGS = {
  settings: "settings",
  banner: "banner",
  gallery: "gallery",
  tools: "tools",
  events: "events",
  event: (slug: string) => `event:${slug}`,
} as const;
