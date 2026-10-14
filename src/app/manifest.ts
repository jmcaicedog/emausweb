import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Emaús Cristo Rey Cali",
    short_name: "Emaús Cristo Rey",
    description: "Comunidad Emaús Hombres de la Parroquia Cristo Rey en Cali.",
    lang: "es-CO",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#b91c1c",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
