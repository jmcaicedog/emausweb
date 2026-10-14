import { ArrowUpRight, BookOpen, Sparkles, Wheat } from "lucide-react";
import Image from "next/image";

type Tool = { id: number; name: string; description: string; url: string; iconUrl: string | null };

function FallbackIcon({ name }: { name: string }) {
  const n = name.toLowerCase();
  const Icon = n.includes("pan") ? Wheat : n.includes("biblia") || n.includes("bíblia") ? BookOpen : Sparkles;
  return <Icon className="size-7" aria-hidden="true" />;
}

export function ToolsSection({ tools }: { tools: Tool[] }) {
  if (tools.length === 0) return null;
  return (
    <section id="herramientas" aria-labelledby="herramientas-title" className="bg-stone-50 py-16 sm:py-24">
      <div className="container-page">
        <p className="eyebrow">Para tu vida de fe</p>
        <h2 id="herramientas-title" className="section-title mt-2">
          Herramientas
        </h2>
        <p className="mt-3 max-w-2xl text-stone-600">Aplicaciones de nuestra comunidad para acompañarte en la oración diaria.</p>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <li key={tool.id}>
              <a
                href={tool.url}
                target="_blank"
                rel="noopener"
                className="group flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-200"
              >
                <span className="grid size-14 place-items-center overflow-hidden rounded-2xl bg-brand-50 text-brand-700">
                  {tool.iconUrl ? <Image src={tool.iconUrl} alt="" width={56} height={56} className="size-14 object-cover" /> : <FallbackIcon name={tool.name} />}
                </span>
                <span className="mt-5 flex items-center gap-2 text-lg font-extrabold">
                  {tool.name}
                  <ArrowUpRight className="size-4 text-stone-400 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-700" aria-hidden="true" />
                </span>
                {tool.description && <span className="mt-2 text-sm leading-relaxed text-stone-600">{tool.description}</span>}
                <span className="sr-only"> (abre en una pestaña nueva)</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
