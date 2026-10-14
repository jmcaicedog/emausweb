import { CalendarDays, Plus, UserSquare2, Users } from "lucide-react";
import Link from "next/link";
import { Badge, Card, PageHeader, buttonCls } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/dal";
import { adminEvents, dashboardStats } from "@/lib/data/admin";
import { formatDateTime } from "@/lib/dates";

// Panel privado: render dinámico por petición, sin validación de navegación instantánea.
export const instant = false;

export const metadata = { title: "Inicio" };

export default async function Dashboard() {
  const [me, stats, upcoming] = await Promise.all([requireAdmin(), dashboardStats(), adminEvents("upcoming")]);
  const cards = [
    { label: "Eventos", value: stats.events, icon: CalendarDays, href: "/admin/eventos" },
    { label: "Personas registradas", value: stats.people, icon: UserSquare2, href: "/admin/personas" },
    { label: "Asistencias", value: stats.attendances, icon: Users, href: "/admin/personas" },
  ];
  return (
    <>
      <PageHeader
        title={`Hola, ${me.name.split(" ")[0]}`}
        description="Resumen de la comunidad Emaús Cristo Rey Cali."
        actions={
          <Link href="/admin/eventos/nuevo" className={buttonCls.primary}>
            <Plus className="size-4" /> Nuevo evento
          </Link>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href} className="rounded-xl border border-stone-200 bg-white p-5 shadow-xs hover:border-brand-200">
            <Icon className="size-5 text-brand-700" />
            <p className="mt-3 text-3xl font-extrabold tabular-nums">{value}</p>
            <p className="text-sm text-stone-600">{label}</p>
          </Link>
        ))}
      </div>
      <Card title="Próximos eventos" actions={<Link href="/admin/eventos" className="text-sm font-semibold text-brand-700 hover:underline">Ver todos</Link>}>
        {upcoming.length === 0 ? (
          <p className="text-sm text-stone-500">No hay eventos próximos.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {upcoming.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <Link href={`/admin/eventos/${e.id}`} className="font-semibold hover:text-brand-700">{e.title}</Link>
                  <p className="text-sm text-stone-500">{formatDateTime(e.startsAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!e.published && <Badge>Borrador</Badge>}
                  <Link href={`/admin/eventos/${e.id}/asistentes`} className="text-sm font-semibold text-stone-600 hover:text-brand-700">
                    {e.attendees} asistentes
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
