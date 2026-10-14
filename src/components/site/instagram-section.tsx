import Image from "next/image";
import { InstagramIcon } from "@/components/icons/brand";

type Item = { id: number; imageUrl: string; alt: string; postUrl: string };

export function InstagramSection({ items, profileUrl }: { items: Item[]; profileUrl: string }) {
  const handle = profileUrl.replace(/\/$/, "").split("/").pop();
  return (
    <section id="instagram" aria-labelledby="instagram-title" className="py-16 sm:py-24">
      <div className="container-page">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">@{handle}</p>
            <h2 id="instagram-title" className="section-title mt-2">
              Síguenos en Instagram
            </h2>
          </div>
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af] px-6 py-3 text-sm font-bold text-white shadow-soft transition hover:opacity-90"
          >
            <InstagramIcon className="size-5" /> Seguir en Instagram
          </a>
        </div>
        {items.length > 0 && (
          <ul className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:thin] sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-5">
            {items.map((item) => (
              <li key={item.id} className="w-[72%] shrink-0 snap-start sm:w-auto">
                <a
                  href={item.postUrl || profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block aspect-square overflow-hidden rounded-2xl bg-stone-100"
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.alt || "Publicación de Instagram de Emaús Cristo Rey Cali"}
                    fill
                    sizes="(max-width: 640px) 72vw, (max-width: 1024px) 33vw, 230px"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                    <InstagramIcon className="size-8" />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
