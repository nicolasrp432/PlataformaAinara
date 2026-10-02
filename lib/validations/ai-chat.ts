import { z } from "zod";
const optionalId = z
  .string()
  .uuid()
  .nullish()
  .transform((value) => value ?? undefined);
export const aiChatSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Escribe una pregunta.")
    .max(6000, "Máximo 6000 caracteres."),
  conversationId: optionalId,
  lessonId: optionalId,
  formationId: optionalId,
});
