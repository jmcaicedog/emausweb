"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { bogotaParts, dayKey, formatTime, startOfBogotaMonth } from "@/lib/dates";
import type { PublicEvent } from "@/lib/data/public";
import { cn } from "@/lib/utils";
import { EventModal } from "./event-modal";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MAX_MONTHS_AHEAD = 24;

function monthInfo(base: Date, offset: number) {
  const p = bogotaParts(base);
  const total = Number(p.year) * 12 + Number(p.month) - 1 + offset;
  const year = Math.floor(total / 12);
  const month = total % 12;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const firstWeekday = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
  const label = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month, 15)));
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  return { year, month, daysInMonth, firstWeekday, label, prefix };
}

export function EventsCalendar({ events, initialMonth }: { events: PublicEvent[]; initialMonth: string }) {
  const [base, setBase] = useState(() => new Date(initialMonth));
  const [offset, setOffset] = useState(0);
  const [today, setToday] = useState<string | null>(null);
  const [selected, setSelected] = useState<PublicEvent | null>(null);

  useEffect(() => {
    const now = new Date();
    const current = startOfBogotaMonth(now);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza con el reloj del cliente tras hidratar
    setToday(dayKey(now));
    if (current.getTime() !== new Date(initialMonth).getTime()) setBase(current);
  }, [initialMonth]);

  const info = useMemo(() => monthInfo(base, offset), [base, offset]);

  const byDay = useMemo(() => {
    const map = new Map<string, PublicEvent[]>();
    for (const ev of events) {
      const key = dayKey(new Date(ev.startsAt));
      if (!key.startsWith(info.prefix)) continue;
      const list = map.get(key) ?? [];
      list.push(ev);
      map.set(key, list);
    }
    return map;
  }, [events, info.prefix]);

  const monthEvents = useMemo(
    () => [...byDay.values()].flat().sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
    [byDay],
  );

  const cells: (number | null)[] = [
    ...Array.from({ length: info.firstWeekday }, () => null),
    ...Array.from({ length: info.daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-soft">
      <div className="flex items-center justify-between gap-2 border-b border-stone-200 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => setOffset((o) => Math.max(0, o - 1))}
          disabled={offset === 0}
          aria-label="Mes anterior"
          className="grid size-10 place-items-center rounded-full text-stone-700 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="size-5" />
        </button>
        <h3 className="text-lg font-extrabold capitalize sm:text-xl" aria-live="polite">
          {info.label}
        </h3>
        <button
          type="button"
          onClick={() => setOffset((o) => Math.min(MAX_MONTHS_AHEAD, o + 1))}
          disabled={offset >= MAX_MONTHS_AHEAD}
          aria-label="Mes siguiente"
          className="grid size-10 place-items-center rounded-full text-stone-700 hover:bg-stone-100 disabled:opacity-30"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-50 text-center text-xs font-bold tracking-wide text-stone-500 uppercase">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} className="min-h-14 border-r border-b border-stone-100 bg-stone-50/50 sm:min-h-28 [&:nth-child(7n)]:border-r-0" />;
          const key = `${info.prefix}-${String(day).padStart(2, "0")}`;
          const list = byDay.get(key) ?? [];
          const isToday = key === today;
          return (
            <div key={key} className="relative min-h-14 border-r border-b border-stone-100 p-1 sm:min-h-28 sm:p-2 [&:nth-child(7n)]:border-r-0">
              <span className={cn("grid size-7 place-items-center rounded-full text-sm font-semibold", isToday ? "bg-brand-700 text-white" : "text-stone-700")}>{day}</span>
              {list.length > 0 && (
                <>
                  <ul className="mt-1 hidden space-y-1 sm:block">
                    {list.slice(0, 3).map((ev) => (
                      <li key={ev.id}>
                        <button
                          type="button"
                          onClick={() => setSelected(ev)}
                          className="w-full truncate rounded-md bg-brand-50 px-2 py-1 text-left text-xs font-semibold text-brand-800 hover:bg-brand-100"
                          title={ev.title}
                        >
                          {formatTime(new Date(ev.startsAt))} · {ev.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => setSelected(list[0])}
                    aria-label={`${list.length} evento(s) el día ${day}: ${list.map((e) => e.title).join(", ")}`}
                    className="absolute inset-0 sm:hidden"
                  >
                    <span className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-0.5">
                      {list.slice(0, 3).map((ev) => (
                        <span key={ev.id} className="size-1.5 rounded-full bg-brand-700" />
                      ))}
                    </span>
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-stone-200 p-4 sm:p-6">
        <h4 className="mb-3 text-sm font-bold tracking-wide text-stone-500 uppercase">Eventos del mes</h4>
        {monthEvents.length === 0 ? (
          <p className="text-sm text-stone-500">No hay eventos programados para este mes.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {monthEvents.map((ev) => {
              const d = new Date(ev.startsAt);
              const p = bogotaParts(d);
              const wd = new Intl.DateTimeFormat("es-CO", { weekday: "short", timeZone: "America/Bogota" }).format(d);
              return (
                <li key={ev.id}>
                  <button type="button" onClick={() => setSelected(ev)} className="flex w-full items-center gap-4 rounded-lg py-3 text-left hover:bg-stone-50 sm:px-2">
                    <span className="grid w-14 shrink-0 place-items-center rounded-xl bg-brand-50 py-1.5 text-brand-800">
                      <span className="text-xs font-bold uppercase">{wd}</span>
                      <span className="text-xl leading-none font-extrabold">{Number(p.day)}</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-bold">{ev.title}</span>
                      <span className="block truncate text-sm text-stone-500">
                        {formatTime(d)}
                        {ev.location ? ` · ${ev.location}` : ""}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <EventModal event={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
