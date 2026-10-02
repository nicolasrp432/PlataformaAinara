import { z } from "zod";
export const lessonResourcesSchema = z
  .array(
    z.object({
      title: z
        .string()
        .trim()
        .min(1, "Escribe el nombre del recurso.")
        .max(200),
      url: z
        .string()
        .url("Escribe un enlace válido.")
        .startsWith("https://", "El enlace debe usar HTTPS.")
        .max(2048),
      type: z.enum(["pdf", "link", "video"]).default("link"),
    }),
  )
  .max(50, "Máximo 50 recursos por lección.");
