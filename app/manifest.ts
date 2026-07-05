import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mitra",
    short_name: "Mitra",
    description:
      "Plataforma de educación para tu desarrollo personal y espiritual. Formaciones, mentoría y comunidad.",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F1E8",
    theme_color: "#B8902E",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  }
}
