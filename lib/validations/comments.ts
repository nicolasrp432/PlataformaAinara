import { z } from "zod"

export const REACTION_TYPES = ["heart", "pray", "lightbulb", "fire"] as const
export type ReactionType = (typeof REACTION_TYPES)[number]

export const commentContentSchema = z
  .string().trim()
  .min(1, "El comentario no puede estar vacío.")
  .max(2000, "Máximo 2000 caracteres.")


export const addCommentSchema = z.object({
  content: commentContentSchema,
  lessonId: z.string().uuid(),
  slug: z.string().min(1),
})

export const addReplySchema = z.object({
  parentId: z.string().uuid(),
  content: commentContentSchema,
  lessonId: z.string().uuid(),
  slug: z.string().min(1),
})

export const toggleReactionSchema = z.object({
  reflectionId: z.string().uuid(),
  type: z.enum(REACTION_TYPES),
  lessonId: z.string().uuid(),
  slug: z.string().min(1),
})

export const deleteCommentSchema = z.object({
  commentId: z.string().uuid(),
  lessonId: z.string().uuid(),
  slug: z.string().min(1),
})
