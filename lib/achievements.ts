import type { LucideIcon } from "lucide-react"
import {
  BookOpen,
  Compass,
  Crown,
  Flame,
  Map,
  MessageSquare,
  Star,
  Sword,
  TrendingUp,
  Zap,
} from "lucide-react"

/**
 * Fuente única de verdad de los logros de la plataforma.
 * Los logros se derivan en tiempo de render de las estadísticas del
 * perfil (getQuestData) — no hay persistencia propia.
 */

export interface QuestStats {
  level: number
  xp: number
  streakDays: number
  lessonsCount: number
  reflectionsCount: number
  enrollmentsCount: number
}

/** Niveles de logro en un solo tono dorado (intensidad creciente). */
export type AchievementTier = "inicio" | "camino" | "cumbre"

export const TIER_LABELS: Record<AchievementTier, string> = {
  inicio: "Inicio",
  camino: "Camino",
  cumbre: "Cumbre",
}

export interface AchievementDef {
  id: string
  title: string
  description: string
  icon: LucideIcon
  tier: AchievementTier
  isUnlocked: (s: QuestStats) => boolean
  requirementLabel: (s: QuestStats) => string
}

export interface ComputedAchievement extends AchievementDef {
  unlocked: boolean
  requirement: string
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "awakening",
    title: "El Despertar",
    description: "Diste tus primeros pasos en la plataforma.",
    icon: Compass,
    tier: "inicio",
    isUnlocked: () => true,
    requirementLabel: () => "Registrarse en la plataforma",
  },
  {
    id: "first_lesson",
    title: "Primera Sangre",
    description: "Completaste tu primera lección.",
    icon: Sword,
    tier: "inicio",
    isUnlocked: (s) => s.lessonsCount >= 1,
    requirementLabel: () => "Completar 1 lección",
  },
  {
    id: "first_voice",
    title: "Voz del Pueblo",
    description: "Compartiste tu primera reflexión.",
    icon: MessageSquare,
    tier: "inicio",
    isUnlocked: (s) => s.reflectionsCount >= 1,
    requirementLabel: () => "Publicar 1 reflexión en Comunidad",
  },
  {
    id: "explorer",
    title: "Explorador",
    description: "Te inscribiste en al menos 2 formaciones.",
    icon: Map,
    tier: "inicio",
    isUnlocked: (s) => s.enrollmentsCount >= 2,
    requirementLabel: () => "Inscribirse en 2 formaciones",
  },
  {
    id: "apprentice",
    title: "Aprendiz Dedicado",
    description: "Completaste 5 lecciones de crecimiento.",
    icon: BookOpen,
    tier: "camino",
    isUnlocked: (s) => s.lessonsCount >= 5,
    requirementLabel: (s) => `Completar 5 lecciones (Llevas ${s.lessonsCount}/5)`,
  },
  {
    id: "fire_streak",
    title: "Llama Interna",
    description: "Racha de 7 días consecutivos activos.",
    icon: Flame,
    tier: "camino",
    isUnlocked: (s) => s.streakDays >= 7,
    requirementLabel: (s) => `Racha de 7 días (Tu racha: ${s.streakDays}d)`,
  },
  {
    id: "collector",
    title: "Coleccionista",
    description: "Acumulaste tus primeros 1,000 XP.",
    icon: Star,
    tier: "camino",
    isUnlocked: (s) => s.xp >= 1000,
    requirementLabel: (s) => `Acumular 1000 XP (Tienes ${s.xp} XP)`,
  },
  {
    id: "warrior",
    title: "Guerrero del Saber",
    description: "Completaste 10 lecciones con éxito.",
    icon: Zap,
    tier: "camino",
    isUnlocked: (s) => s.lessonsCount >= 10,
    requirementLabel: (s) => `Completar 10 lecciones (Llevas ${s.lessonsCount}/10)`,
  },
  {
    id: "level5",
    title: "Ascensión",
    description: "Alcanzaste el Nivel 5 de evolución.",
    icon: TrendingUp,
    tier: "cumbre",
    isUnlocked: (s) => s.level >= 5,
    requirementLabel: (s) => `Alcanzar el nivel 5 (Eres nivel ${s.level})`,
  },
  {
    id: "legend",
    title: "Leyenda de la Matriz",
    description: "Nivel 10 — cúspide del conocimiento.",
    icon: Crown,
    tier: "cumbre",
    isUnlocked: (s) => s.level >= 10,
    requirementLabel: (s) => `Alcanzar el nivel 10 (Eres nivel ${s.level})`,
  },
]

export function computeAchievements(stats: QuestStats): ComputedAchievement[] {
  return ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: a.isUnlocked(stats),
    requirement: a.requirementLabel(stats),
  }))
}
