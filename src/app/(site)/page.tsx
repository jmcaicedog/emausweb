import Image from "next/image";
import { JsonLd } from "@/components/seo/json-ld";
import { Banner } from "@/components/site/banner";
import { ContactSection } from "@/components/site/contact-section";
import { EventsCalendar } from "@/components/site/events-calendar";
import { GospelSection } from "@/components/site/gospel-section";
import { InstagramSection } from "@/components/site/instagram-section";
import { PrayersSection } from "@/components/site/prayers-section";
import { ToolsSection } from "@/components/site/tools-section";
import { getActiveSlides, getActiveTools, getCalendarEvents, getGallery, getSettings } from "@/lib/data/public";
import { siteUrl } from "@/lib/utils";
import logo from "../../../public/logo.png";

export default async function HomePage() {
  const [settings, slides, calendar, tools, gallery] = await Promise.all([
    getSettings(),
    getActiveSlides(),
    getCalendarEvents(),
    getActiveTools(),
    getGallery(),
  ]);
  const showBanner = settings.bannerEnabled && slides.length > 0;
  const bannerHasH1 = showBanner && !!slides[0].title;
  const url = siteUrl();

  const orgLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Emaús Cristo Rey Cali",
    url,
    logo: `${url}/icon-512.png`,
    description: settings.seoDescription,
    sameAs: [settings.instagramUrl],
    ...(settings.email ? { email: settings.email } : {}),
    ...(settings.phone ? { telephone: settings.phone } : {}),
    ...(settings.address
      ? { address: { "@type": "PostalAddress", streetAddress: settings.address, addressLocality: "Cali", addressRegion: "Valle del Cauca", addressCountry: "CO" } }
      : {}),
  };

  return (
    <>
      <JsonLd data={orgLd} />
      {showBanner ? (
        <>
          {!bannerHasH1 && <h1 className="sr-only">Emaús Cristo Rey Cali</h1>}
          <Banner slides={slides} />
        </>
      ) : (
        <section id="inicio" className="border-b border-stone-100 bg-gradient-to-b from-white to-stone-50">
          <div className="container-page flex flex-col items-center py-16 text-center sm:py-24">
            <Image src={logo} alt="Logo de Emaús Cristo Rey Cali" width={128} height={128} sizes="128px" className="size-28 object-contain sm:size-32" preload />
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-balance sm:text-6xl">Emaús Cristo Rey Cali</h1>
            <p className="mt-4 max-w-2xl text-lg text-stone-600">{settings.seoDescription}</p>
          </div>
        </section>
      )}

      <section id="eventos" aria-labelledby="eventos-title" className="py-16 sm:py-24">
        <div className="container-page">
          <p className="eyebrow">Agenda</p>
          <h2 id="eventos-title" className="section-title mt-2">
            Calendario de eventos
          </h2>
          <p className="mt-3 max-w-2xl text-stone-600">Consulta nuestras actividades y encuentros. Toca un evento para ver los detalles.</p>
          <div className="mt-10">
            <EventsCalendar events={calendar.events} initialMonth={calendar.monthStart} />
          </div>
        </div>
      </section>

      {settings.gospelEnabled && <GospelSection channelId={settings.gospelChannelId} keyword={settings.gospelKeyword} />}
      <PrayersSection morning={settings.morningPrayer} evening={settings.eveningPrayer} />
      <ToolsSection tools={tools} />
      <InstagramSection items={gallery} profileUrl={settings.instagramUrl} />
      <ContactSection settings={settings} />
    </>
  );
}
