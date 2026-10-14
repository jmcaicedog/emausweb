import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { getSettings } from "@/lib/data/public";
import { siteUrl } from "@/lib/utils";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const title = settings.seoTitle;
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: title, template: `%s | ${title}` },
    description: settings.seoDescription,
    applicationName: "Emaús Cristo Rey Cali",
    keywords: ["Emaús", "Emaús Cristo Rey", "Emaús Cali", "Emaús hombres", "retiro Emaús", "Parroquia Cristo Rey Cali", "comunidad católica Cali"],
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "es_CO",
      siteName: "Emaús Cristo Rey Cali",
      title,
      description: settings.seoDescription,
      url: "/",
    },
    twitter: { card: "summary_large_image", title, description: settings.seoDescription },
    robots: { index: true, follow: true },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-CO" className={manrope.variable}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
