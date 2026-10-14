import "server-only";
import { cacheLife } from "next/cache";
import { dayKey } from "@/lib/dates";

export type DailyGospel = { videoId: string; title: string; day: string; isToday: boolean };

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

function decodeXml(s: string) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** Extrae "YYYY-MM-DD" de títulos como "EVANGELIO DE HOY MIÉRCOLES 14 DE OCTUBRE DE 2026". */
export function dayFromTitle(title: string): string | null {
  const m = normalize(title).match(/(\d{1,2}) de ([a-z]+)(?: de| del)? (\d{4})/);
  if (!m) return null;
  const month = MONTHS.indexOf(m[2] === "setiembre" ? "septiembre" : m[2]);
  if (month < 0) return null;
  return `${m[3]}-${String(month + 1).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

/**
 * Busca en el feed RSS público del canal el video del día cuyo título contiene la palabra clave.
 * Si aún no se ha publicado el de hoy, devuelve el más reciente que no sea de una fecha futura.
 * Se revalida cada hora, por lo que el cambio de día se refleja como máximo una hora después.
 */
export async function getDailyGospel(channelId: string, keyword: string): Promise<DailyGospel | null> {
  "use cache";
  cacheLife("hours");
  if (!channelId || !keyword) return null;
  try {
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const xml = await res.text();
    const today = dayKey(new Date());
    const needle = normalize(keyword);

    const candidates = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)]
      .map(([, entry]) => {
        const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
        const title = decodeXml(entry.match(/<title>([^<]*)<\/title>/)?.[1] ?? "");
        const published = entry.match(/<published>([^<]+)<\/published>/)?.[1];
        if (!videoId || !normalize(title).includes(needle)) return null;
        const day = dayFromTitle(title) ?? (published ? dayKey(new Date(published)) : null);
        return day && day <= today ? { videoId, title, day, isToday: day === today } : null;
      })
      .filter((x): x is DailyGospel => x !== null)
      .sort((a, b) => b.day.localeCompare(a.day));

    return candidates[0] ?? null;
  } catch (e) {
    console.error("No se pudo leer el feed de YouTube", e);
    return null;
  }
}
