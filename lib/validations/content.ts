import { z } from 'zod';

export const createFormationSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres').max(100),
  slug: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  long_description: z.string().optional().nullable(),
  thumbnail_url: z.string().url('Debe ser una URL válida').optional().nullable(),
  trailer_url: z.string().url('Debe ser una URL válida').optional().nullable(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  duration_minutes: z.number().int().min(0).default(0),
  is_published: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  is_premium: z.boolean().default(true),
  price: z.number().min(0, 'El precio no puede ser negativo').default(0),
  xp_reward: z.number().int().min(0).default(100),
  sort_order: z.number().int().default(0),
});

export const updateFormationSchema = createFormationSchema.partial();

export const createModuleSchema = z.object({
  formation_id: z.string().uuid('ID de formación inválido'),
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres').max(100),
  description: z.string().max(500).optional().nullable(),
  sort_order: z.number().int().default(0),
  is_published: z.boolean().default(false),
});

export const updateModuleSchema = createModuleSchema.partial().omit({ formation_id: true });

export const createLessonSchema = z.object({
  module_id: z.string().uuid('ID de módulo inválido'),
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres').max(100),
  slug: z.string().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  content_type: z.enum(['video', 'text', 'quiz', 'exercise', 'meditation']).default('video'),
  video_url: z.string().url().optional().nullable(),
  duration_seconds: z.number().int().min(0).default(0),
  is_free: z.boolean().default(false),
  is_published: z.boolean().default(false),
  sort_order: z.number().int().default(0),
  xp_reward: z.number().int().min(0).default(25),
});

export const updateLessonSchema = createLessonSchema.partial().omit({ module_id: true });

export type CreateFormationInput = z.infer<typeof createFormationSchema>;
export type UpdateFormationInput = z.infer<typeof updateFormationSchema>;
export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
