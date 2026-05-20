import { z } from "zod"

export const progressPostSchema = z.object({
  lessonId: z.string().min(1, "lessonId requerido."),
  watchedSeconds: z.number().int().min(0).max(60 * 60 * 24).optional(),
  isCompleted: z.boolean().optional(),
})
