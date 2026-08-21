import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mi Regreso al Gym",
    short_name: "Regreso al Gym",
    description:
      "Plan de reincorporación al gimnasio: rutina torso/pierna de 4 días, calculadora de macros y dieta con batch cooking.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfbfa",
    theme_color: "#1f8a56",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png" },
      { src: "/icon-512", sizes: "512x512", type: "image/png" },
    ],
  };
}
