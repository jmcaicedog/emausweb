import { Mail, MapPin, Phone, User, UserRound } from "lucide-react";
import type { PublicSettings } from "@/lib/data/public";

export function ContactSection({ settings }: { settings: PublicSettings }) {
  const items = [
    settings.address && { icon: MapPin, label: "Dirección", value: settings.address, href: settings.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address + ", Cali")}`, external: true },
    settings.phone && { icon: Phone, label: "Teléfono", value: settings.phone, href: `tel:${settings.phone.replace(/[^\d+]/g, "")}` },
    settings.email && { icon: Mail, label: "Correo electrónico", value: settings.email, href: `mailto:${settings.email}` },
    settings.groupCoordinator && { icon: User, label: "Coordinador del grupo", value: settings.groupCoordinator },
    settings.spiritualCoordinator && { icon: UserRound, label: "Coordinador espiritual", value: settings.spiritualCoordinator },
  ].filter(Boolean) as { icon: typeof MapPin; label: string; value: string; href?: string; external?: boolean }[];

  return (
    <section id="contacto" aria-labelledby="contacto-title" className="bg-stone-50 py-16 sm:py-24">
      <div className="container-page">
        <p className="eyebrow">Estamos para servirte</p>
        <h2 id="contacto-title" className="section-title mt-2">
          Contacto
        </h2>
        <address className="mt-10 grid gap-5 not-italic sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, label, value, href, external }) => {
            const content = (
              <>
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-bold tracking-wide text-stone-500 uppercase">{label}</span>
                  <span className="mt-1 block font-semibold break-words text-ink">{value}</span>
                </span>
              </>
            );
            const cls = "flex h-full items-start gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-soft";
            return href ? (
              <a key={label} href={href} className={`${cls} transition hover:border-brand-200`} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {content}
              </a>
            ) : (
              <div key={label} className={cls}>
                {content}
              </div>
            );
          })}
        </address>
      </div>
    </section>
  );
}
