export const REFLECTION_CATEGORIES = [
  "reflection",
  "question",
  "practice",
  "gratitude",
  "testimonial",
] as const

export type ReflectionCategory = (typeof REFLECTION_CATEGORIES)[number]

export function isReflectionCategory(value: unknown): value is ReflectionCategory {
  return typeof value === "string" && REFLECTION_CATEGORIES.includes(value as ReflectionCategory)
}
