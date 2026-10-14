"use client";

import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Children, useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function BannerCarousel({ children, count }: { children: React.ReactNode; count: number }) {
  const multiple = count > 1;
  const [plugins] = useState(() => {
    if (!multiple || typeof window === "undefined") return [];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return reduce ? [] : [Autoplay({ delay: 6000, stopOnInteraction: false, stopOnMouseEnter: true })];
  });
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: multiple, active: multiple }, plugins);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  const prev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const next = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {Children.map(children, (child, i) => (
            <div className="min-w-0 shrink-0 grow-0 basis-full" role="group" aria-roledescription="diapositiva" aria-label={`${i + 1} de ${count}`}>
              {child}
            </div>
          ))}
        </div>
      </div>
      {multiple && (
        <>
          <button type="button" onClick={prev} aria-label="Diapositiva anterior" className="absolute top-1/2 left-3 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-ink shadow hover:bg-white sm:grid">
            <ChevronLeft className="size-5" />
          </button>
          <button type="button" onClick={next} aria-label="Diapositiva siguiente" className="absolute top-1/2 right-3 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-ink shadow hover:bg-white sm:grid">
            <ChevronRight className="size-5" />
          </button>
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
            {Array.from({ length: count }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => emblaApi?.scrollTo(i)}
                aria-label={`Ir a la diapositiva ${i + 1}`}
                aria-current={selected === i}
                className={cn("h-2 rounded-full transition-all", selected === i ? "w-6 bg-white" : "w-2 bg-white/60 hover:bg-white/80")}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
