import { Search } from "lucide-react";
import Link from "next/link";
import { PageHeader, buttonCls, inputCls } from "@/components/admin/ui";
import { adminPeople } from "@/lib/data/admin";
import { formatShortDate } from "@/lib/dates";

// Panel privado: render dinámico por petición, sin validación de navegación instantánea.
export const instant = false;

export const metadata = { title: "Personas" };

export default async function PeoplePage({ searchParams }: PageProps<"/admin/personas">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : "";
  const list = await adminPeople(q);
  return (
    <>
      <PageHeader title="Personas" description="Todas las personas que han diligenciado algún llamado a lista." />
      <form role="search" className="mb-5 flex gap-2">
        <label htmlFor="q" className="sr-only">Buscar</label>
        <input id="q" name="q" type="search" defaultValue={q} placeholder="Buscar por nombre, cédula o teléfono" className={inputCls} />
        <button type="submit" className={buttonCls.secondary}>
          <Search className="size-4" /> Buscar
        </button>
      </form>
      {list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-500">{q ? "Sin resultados." : "Aún no hay registros."}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs font-bold tracking-wide text-stone-500 uppercase">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Cédula</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Nacimiento</th>
                <th className="px-4 py-3 text-right">Asistencias</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {list.map((p) => (
                <tr key={p.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3 font-semibold">
                    <Link href={`/admin/personas/${p.id}`} className="hover:text-brand-700">{p.fullName}</Link>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{p.documentNumber}</td>
                  <td className="px-4 py-3 tabular-nums">{p.phone}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatShortDate(p.birthDate)}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{p.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
