import { getImageProps } from "next/image";
import Link from "next/link";
import { BannerCarousel } from "./banner-carousel";

type Slide = {
  id: number;
  imageUrl: string;
  mobileImageUrl: string | null;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaUrl: string;
};

function SlidePicture({ slide, first }: { slide: Slide; first: boolean }) {
  const common = { alt: slide.title || "Emaús Cristo Rey Cali", sizes: "100vw", quality: 75, preload: first, fetchPriority: first ? ("high" as const) : undefined, loading: first ? undefined : ("lazy" as const) };
  const {
    props: { srcSet: desktop },
  } = getImageProps({ ...common, width: 1920, height: 800, src: slide.imageUrl });
  const {
    props: { srcSet: mobile, ...rest },
  } = getImageProps({ ...common, width: 900, height: 1125, src: slide.mobileImageUrl || slide.imageUrl });
  return (
    <picture>
      <source media="(min-width: 768px)" srcSet={desktop} />
      <source media="(max-width: 767px)" srcSet={mobile} />
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <img {...rest} className="absolute inset-0 size-full object-cover" />
    </picture>
  );
}

export function Banner({ slides }: { slides: Slide[] }) {
  if (slides.length === 0) return null;
  const items = slides.map((slide, i) => {
    const external = /^https?:\/\//.test(slide.ctaUrl);
    return (
      <div key={slide.id} className="relative aspect-[4/5] w-full sm:aspect-[16/9] md:aspect-[12/5]">
        <SlidePicture slide={slide} first={i === 0} />
        {(slide.title || slide.subtitle || slide.ctaLabel) && (
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-black/20 to-transparent">
            <div className="container-page pb-12 sm:pb-16">
              <div className="max-w-2xl text-white">
                {slide.title &&
                  (i === 0 ? (
                    <h1 className="text-3xl font-extrabold tracking-tight text-balance sm:text-5xl">{slide.title}</h1>
                  ) : (
                    <p className="text-3xl font-extrabold tracking-tight text-balance sm:text-5xl">{slide.title}</p>
                  ))}
                {slide.subtitle && <p className="mt-3 text-base text-white/90 sm:text-lg">{slide.subtitle}</p>}
                {slide.ctaLabel && slide.ctaUrl && (
                  <Link
                    href={slide.ctaUrl}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-bold text-ink transition hover:bg-brand-50"
                  >
                    {slide.ctaLabel}
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  });
  return (
    <section id="inicio" aria-roledescription="carrusel" aria-label="Destacados" className="relative bg-stone-900">
      <BannerCarousel count={items.length}>{items}</BannerCarousel>
    </section>
  );
}
