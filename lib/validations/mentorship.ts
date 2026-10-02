import { z } from "zod"

export const mentorshipCheckoutSchema = z.object({
  mentorId: z.string().uuid("Mentor inválido."),
  scheduledAt: z
    .string()
    .min(1, "Fecha requerida.")
    .refine((v) => !Number.isNaN(new Date(v).getTime()), "Fecha inválida.")
    .refine((v) => new Date(v).getTime() > Date.now(), "La sesión debe ser en el futuro."),
  notes: z.string().max(1000, "Máximo 1000 caracteres.").optional(),
})

export type MentorshipCheckoutInput = z.infer<typeof mentorshipCheckoutSchema>

export const mentorshipRequestSchema = z.object({
  mentorId: z.string().uuid().optional(),
  notes: z.string().trim().min(10,"Describe tu consulta con al menos 10 caracteres.").max(1000,"Máximo 1000 caracteres."),
})
