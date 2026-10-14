import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { AdminNav } from "@/components/admin/nav";
import { requireAdmin } from "@/lib/auth/dal";
import { logout } from "@/lib/actions/auth";
import logo from "../../../../public/logo.png";

export const instant = false;

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-stone-200 bg-white lg:sticky lg:top-0 lg:h-dvh lg:border-r lg:border-b-0">
        <div className="flex h-full flex-col">
          <Link href="/admin" className="flex items-center gap-3 px-5 py-4">
            <Image src={logo} alt="" width={36} height={36} className="size-9 object-contain" />
            <span className="text-sm leading-tight font-extrabold">
              Emaús Cristo Rey
              <span className="block text-xs font-semibold text-stone-500">Administración</span>
            </span>
          </Link>
          <AdminNav />
          <div className="mt-auto hidden border-t border-stone-200 p-4 lg:block">
            <Suspense fallback={null}>
              <UserBox />
            </Suspense>
          </div>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-6 sm:px-8 lg:py-10">
        <Suspense
          fallback={
            <div className="grid h-60 place-items-center text-stone-400">
              <Loader2 className="size-6 animate-spin" />
            </div>
          }
        >
          <Gate>{children}</Gate>
        </Suspense>
      </main>
    </div>
  );
}

async function Gate({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <div className="mx-auto max-w-5xl">{children}</div>;
}

async function UserBox() {
  const user = await requireAdmin();
  return (
    <div className="text-sm">
      <p className="truncate font-bold">{user.name}</p>
      <p className="truncate text-xs text-stone-500">{user.email}</p>
      <form action={logout} className="mt-3">
        <button type="submit" className="text-xs font-semibold text-brand-700 hover:underline">
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
