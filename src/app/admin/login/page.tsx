import Image from "next/image";
import { Suspense } from "react";
import logo from "../../../../public/logo.png";
import { LoginForm } from "./login-form";

export const metadata = { title: "Ingresar" };

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src={logo} alt="Emaús Cristo Rey Cali" width={72} height={72} className="size-18 object-contain" preload />
          <h1 className="mt-4 text-xl font-extrabold">Panel de administración</h1>
          <p className="text-sm text-stone-500">Emaús Cristo Rey Cali</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-xs">
          <Suspense fallback={<LoginForm next="" />}>
            <LoginFormWithNext searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

async function LoginFormWithNext({ searchParams }: { searchParams: PageProps<"/admin/login">["searchParams"] }) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "";
  return <LoginForm next={next} />;
}
