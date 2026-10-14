import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150);
}

export function siteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");
  return url.replace(/\/$/, "");
}

export function whatsappLink(number: string, message?: string) {
  const digits = number.replace(/\D/g, "");
  if (!digits) return null;
  const qs = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${qs}`;
}

export function isSafeUrl(value: string) {
  if (!value) return true;
  if (value.startsWith("/") || value.startsWith("#")) return true;
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}
