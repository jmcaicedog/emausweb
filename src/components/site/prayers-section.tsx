import { Moon, Sun } from "lucide-react";

type Props = { morning: string; evening: string };

function paragraphs(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function PrayersSection({ morning, evening }: Props) {
  const prayers = [
    { key: "manana", title: "Oración de la mañana", text: morning, Icon: Sun, accent: "bg-amber-50 text-amber-600" },
    { key: "noche", title: "Oración de la noche", text: evening, Icon: Moon, accent: "bg-indigo-50 text-indigo-600" },
  ].filter((p) => p.text.trim());
  if (prayers.length === 0) return null;

  return (
    <section id="oraciones" aria-labelledby="oraciones-title" className="border-t border-stone-100 bg-gradient-to-b from-amber-50/50 via-white to-indigo-50/40 py-16 sm:py-24">
      <div className="container-page">
        <p className="eyebrow">Para cada día</p>
        <h2 id="oraciones-title" className="section-title mt-2">
          Oraciones
        </h2>
        <p className="mt-3 max-w-2xl text-stone-600">Empieza y termina tu jornada en la presencia de Dios.</p>
        <div className={`mt-10 grid gap-6 ${prayers.length > 1 ? "lg:grid-cols-2" : "max-w-3xl"}`}>
          {prayers.map(({ key, title, text, Icon, accent }) => (
            <article key={key} id={`oracion-${key}`} className="flex flex-col rounded-2xl border border-stone-200 bg-white p-6 shadow-soft sm:p-8">
              <div className="flex items-center gap-4">
                <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${accent}`}>
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <h3 className="text-xl font-extrabold sm:text-2xl">{title}</h3>
              </div>
              <div className="mt-5 space-y-4 font-serif text-[1.05rem] leading-relaxed text-stone-700 whitespace-pre-line">
                {paragraphs(text).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
