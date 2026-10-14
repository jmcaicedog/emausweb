import Image from "next/image";
import Link from "next/link";
import logo from "../../../public/logo.png";
import { MobileMenu } from "./mobile-menu";

export const NAV_ITEMS = [
  { href: "/#eventos", label: "Eventos" },
  { href: "/#herramientas", label: "Herramientas" },
  { href: "/#instagram", label: "Instagram" },
  { href: "/#contacto", label: "Contacto" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3" aria-label="Emaús Cristo Rey Cali - Inicio">
          <Image src={logo} alt="" width={40} height={40} sizes="40px" className="size-10 object-contain" />
          <span className="leading-tight">
            <span className="block text-base font-extrabold tracking-tight">Emaús Cristo Rey</span>
            <span className="block text-xs font-semibold tracking-wide text-stone-500">CALI</span>
          </span>
        </Link>
        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="rounded-full px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <MobileMenu items={NAV_ITEMS} />
      </div>
    </header>
  );
}
