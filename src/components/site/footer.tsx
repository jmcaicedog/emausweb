import Link from "next/link";
import { InstagramIcon } from "@/components/icons/brand";

export function SiteFooter({ instagramUrl, year }: { instagramUrl: string; year: number }) {
  return (
    <footer className="border-t border-stone-200 bg-stone-50">
      <div className="container-page flex flex-col items-center justify-between gap-4 py-8 text-sm text-stone-600 sm:flex-row">
        <p>© {year} Emaús Cristo Rey Cali. Todos los derechos reservados.</p>
        <div className="flex items-center gap-4">
          <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-brand-700">
            <InstagramIcon className="size-4" /> Instagram
          </a>
          <Link href="/privacidad" className="hover:text-brand-700">
            Tratamiento de datos
          </Link>
        </div>
      </div>
    </footer>
  );
}
