import { ArrowLeft, CalendarDays, Clock, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import { getEventBySlug, getPublishedEventSlugs } from "@/lib/data/public";
import { formatEventDate, formatTimeRange } from "@/lib/dates";
import { siteUrl } from "@/lib/utils";

// Render bloqueante: el contenido completo llega en el HTML (mejor para SEO) también para eventos creados después del build.
export const instant = false;

export async function generateStaticParams() {
  const rows = await getPublishedEventSlugs();
  // Next exige al menos un parámetro con Cache Components.
  return rows.length ? rows.map((r) => ({ slug: r.slug })) : [{ slug: "proximamente" }];
}

export async function generateMetadata({ params }: PageProps<"/eventos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Evento no encontrado", robots: { index: false } };
  const description = (event.description || `${event.title} - ${formatEventDate(event.startsAt)}`).slice(0, 160);
  return {
    title: event.title,
    description,
    alternates: { canonical: `/eventos/${event.slug}` },
    openGraph: {
      type: "article",
      title: event.title,
      description,
      url: `/eventos/${event.slug}`,
      ...(event.imageUrl ? { images: [{ url: event.imageUrl, alt: event.title }] } : {}),
    },
  };
}

export default async function EventPage({ params }: PageProps<"/eventos/[slug]">) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();
  const url = siteUrl();
  const abs = (u: string) => (u.startsWith("http") ? u : `${url}${u}`);

  const eventLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: event.startsAt.toISOString(),
    ...(event.endsAt ? { endDate: event.endsAt.toISOString() } : {}),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    ...(event.imageUrl ? { image: [abs(event.imageUrl)] } : {}),
    location: {
      "@type": "Place",
      name: event.location || "Cali",
      address: { "@type": "PostalAddress", streetAddress: event.location, addressLocality: "Cali", addressCountry: "CO" },
    },
    organizer: { "@type": "Organization", name: "Emaús Cristo Rey Cali", url },
    url: `${url}/eventos/${event.slug}`,
  };

  return (
    <article className="py-10 sm:py-16">
      <JsonLd data={eventLd} />
      <div className="container-page max-w-3xl">
        <Link href="/#eventos" className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-brand-700">
          <ArrowLeft className="size-4" /> Volver al calendario
        </Link>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-balance sm:text-5xl">{event.title}</h1>
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-stone-700">
          <li className="flex items-center gap-2">
            <CalendarDays className="size-4 text-brand-700" />
            <time dateTime={event.startsAt.toISOString()}>{formatEventDate(event.startsAt)}</time>
          </li>
          <li className="flex items-center gap-2">
            <Clock className="size-4 text-brand-700" />
            {formatTimeRange(event.startsAt, event.endsAt)}
          </li>
          {event.location && (
            <li className="flex items-center gap-2">
              <MapPin className="size-4 text-brand-700" />
              {event.mapUrl ? (
                <a href={event.mapUrl} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
                  {event.location}
                </a>
              ) : (
                event.location
              )}
            </li>
          )}
        </ul>
        {event.imageUrl && (
          <div className="relative mt-8 aspect-[16/10] overflow-hidden rounded-2xl bg-stone-100">
            <Image src={event.imageUrl} alt={event.title} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" preload />
          </div>
        )}
        {event.description && <div className="mt-8 text-lg leading-relaxed whitespace-pre-line text-stone-700">{event.description}</div>}
      </div>
    </article>
  );
}
