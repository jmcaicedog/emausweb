import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { getCurrentYear, getSettings } from "@/lib/data/public";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [settings, year] = await Promise.all([getSettings(), getCurrentYear()]);
  return (
    <>
      <a href="#contenido" className="sr-only z-50 rounded bg-white px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Saltar al contenido
      </a>
      <SiteHeader />
      <main id="contenido">{children}</main>
      <SiteFooter instagramUrl={settings.instagramUrl} year={year} />
      <WhatsAppButton number={settings.whatsappNumber} message={settings.whatsappMessage} />
    </>
  );
}
