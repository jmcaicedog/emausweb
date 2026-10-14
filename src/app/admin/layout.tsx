import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Administración", template: "%s | Admin Emaús Cristo Rey" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return <div className="min-h-dvh bg-stone-50">{children}</div>;
}
