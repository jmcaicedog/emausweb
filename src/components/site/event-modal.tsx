"use client";

import { CalendarDays, Clock, ExternalLink, MapPin, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { formatEventDate, formatTimeRange } from "@/lib/dates";
import type { PublicEvent } from "@/lib/data/public";

export function EventModal({ event, onClose }: { event: PublicEvent | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (event && !dialog.open) dialog.showModal();
    if (!event && dialog.open) dialog.close();
  }, [event]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close();
      }}
      aria-labelledby="event-modal-title"
      className="m-auto w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-2xl bg-white p-0 shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      {event && (
        <div className="max-h-[90dvh] overflow-y-auto">
          <div className="relative">
            {event.imageUrl ? (
              <div className="relative aspect-[16/10] w-full bg-stone-100">
                <Image src={event.imageUrl} alt={event.title} fill sizes="(max-width: 640px) 100vw, 576px" className="object-cover" />
              </div>
            ) : (
              <div className="h-3 bg-brand-700" />
            )}
            <button
              type="button"
              onClick={() => ref.current?.close()}
              aria-label="Cerrar"
              className="absolute top-3 right-3 grid size-10 place-items-center rounded-full bg-white/90 text-ink shadow hover:bg-white"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="space-y-4 p-6">
            <h3 id="event-modal-title" className="text-2xl font-extrabold tracking-tight">
              {event.title}
            </h3>
            <ul className="space-y-2 text-sm text-stone-700">
              <li className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 size-4 shrink-0 text-brand-700" />
                <span>{formatEventDate(new Date(event.startsAt))}</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 size-4 shrink-0 text-brand-700" />
                <span>{formatTimeRange(new Date(event.startsAt), event.endsAt ? new Date(event.endsAt) : null)}</span>
              </li>
              {event.location && (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-brand-700" />
                  <span>
                    {event.location}
                    {event.mapUrl && (
                      <>
                        {" · "}
                        <a href={event.mapUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 underline-offset-2 hover:underline">
                          Ver mapa
                        </a>
                      </>
                    )}
                  </span>
                </li>
              )}
            </ul>
            {event.description && <p className="text-[15px] leading-relaxed whitespace-pre-line text-stone-700">{event.description}</p>}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href={`/eventos/${event.slug}`} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white hover:bg-stone-800">
                Ver detalles <ExternalLink className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
