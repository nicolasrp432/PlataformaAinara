import { z } from "zod"

export const enrollSchema = z.object({
  formationId: z.string().min(1, "formationId requerido."),
  slug: z.string().optional(),
})
