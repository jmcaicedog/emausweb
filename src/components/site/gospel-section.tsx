import { ArrowUpRight } from "lucide-react";
import { getDailyGospel } from "@/lib/data/gospel";
import { YouTubeLite } from "./youtube-lite";

const longDate = new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export async function GospelSection({ channelId, keyword }: { channelId: string; keyword: string }) {
  const gospel = await getDailyGospel(channelId, keyword);
  if (!gospel) return null;
  const date = longDate.format(new Date(`${gospel.day}T00:00:00Z`));

  return (
    <section id="evangelio" aria-labelledby="evangelio-title" className="border-t border-stone-100 py-16 sm:py-24">
      <div className="container-page grid items-center gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <p className="eyebrow">{gospel.isToday ? "Hoy" : "Más reciente"}</p>
          <h2 id="evangelio-title" className="section-title mt-2">
            Evangelio del día
          </h2>
          <p className="mt-3 text-lg font-semibold text-stone-800 first-letter:uppercase">{date}</p>
          <p className="mt-3 max-w-md text-stone-600">Escucha y medita la Palabra de Dios de cada día con el Padre Ronal Pulido.</p>
          <a
            href={`https://www.youtube.com/watch?v=${gospel.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:underline"
          >
            Ver en YouTube <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
        </div>
        <YouTubeLite videoId={gospel.videoId} title={gospel.title} />
      </div>
    </section>
  );
}
