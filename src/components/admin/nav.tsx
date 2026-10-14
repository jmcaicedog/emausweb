"use client";

import { CalendarDays, Camera, Cog, ExternalLink, Images, LayoutDashboard, LogOut, Users, UserSquare2, Wrench } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Inicio", icon: LayoutDashboard, exact: true },
  { href: "/admin/eventos", label: "Eventos y QR", icon: CalendarDays },
  { href: "/admin/personas", label: "Personas", icon: UserSquare2 },
  { href: "/admin/banner", label: "Banner", icon: Images },
  { href: "/admin/galeria", label: "Instagram", icon: Camera },
  { href: "/admin/herramientas", label: "Herramientas", icon: Wrench },
  { href: "/admin/configuracion", label: "Configuración", icon: Cog },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Administración" className="overflow-x-auto px-3 pb-3 lg:overflow-visible">
      <ul className="flex gap-1 lg:flex-col">
        {ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap",
                  active ? "bg-brand-50 text-brand-800" : "text-stone-700 hover:bg-stone-100",
                )}
              >
                <Icon className="size-4" /> {label}
              </Link>
            </li>
          );
        })}
        <li>
          <a href="/" target="_blank" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap text-stone-700 hover:bg-stone-100">
            <ExternalLink className="size-4" /> Ver sitio
          </a>
        </li>
        <li className="lg:hidden">
          <form action={logout}>
            <button type="submit" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap text-stone-700 hover:bg-stone-100">
              <LogOut className="size-4" /> Salir
            </button>
          </form>
        </li>
      </ul>
    </nav>
  );
}
