import { z } from "zod";
const option = z.object({
  option_text: z.string().trim().min(1).max(1000),
  is_correct: z.boolean(),
  sort_order: z.number().int().optional(),
});
const question = z
  .object({
    question: z.string().trim().min(1).max(2000),
    type: z.enum(["multiple_choice", "true_false"]),
    explanation: z.string().max(4000).nullable().optional(),
    sort_order: z.number().int().optional(),
    options: z.array(option).min(2).max(6),
  })
  .refine(
    (q) => q.options.filter((o) => o.is_correct).length === 1,
    "Cada pregunta debe tener una respuesta correcta",
  )
  .refine(
    (q) => q.type !== "true_false" || q.options.length === 2,
    "Verdadero/falso necesita dos opciones",
  );
export const quizSchema = z.object({
  lessonId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(4000).nullable().optional(),
  passing_score: z.number().int().min(1).max(100),
  xp_reward: z.number().int().min(0).max(10000),
  questions: z.array(question).min(1).max(50),
});
