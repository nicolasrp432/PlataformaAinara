import { z } from "zod"

export const mentorshipCheckoutSchema = z.object({
  mentorId: z.string().min(1, "Mentor requerido."),
  scheduledAt: z
    .string()
    .min(1, "Fecha requerida.")
    .refine((v) => !Number.isNaN(new Date(v).getTime()), "Fecha inválida.")
    .refine((v) => new Date(v).getTime() > Date.now(), "La sesión debe ser en el futuro."),
  notes: z.string().max(1000, "Máximo 1000 caracteres.").optional(),
})

export type MentorshipCheckoutInput = z.infer<typeof mentorshipCheckoutSchema>
