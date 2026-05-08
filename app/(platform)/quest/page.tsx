import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getAuthUser, getQuestData } from "@/lib/data-access"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Compass, Trophy, Sword, Target, Map, Award, Star,
  BookOpen, Zap, TrendingUp, Flame, Lock, CheckCircle2, Crown, MessageSquare
} from "lucide-react"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Aventura | Ainara",
  description: "Cumple tus misiones, gana experiencia y sube de nivel.",
}

export type AchievementTier = "bronze" | "silver" | "gold"

export interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ElementType
  xpReward: number
  tier: AchievementTier
  unlocked: boolean
}

const TIER_COLORS: Record<AchievementTier, string> = {
  bronze: "text-amber-600",
  silver: "text-slate-400",
  gold: "text-primary",
}

const TIER_BG: Record<AchievementTier, string> = {
  bronze: "bg-amber-500/10 border-amber-500/20",
  silver: "bg-slate-400/10 border-slate-400/20",
  gold: "bg-primary/10 border-primary/20",
}

export default async function QuestPage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const questData = await getQuestData(user.id)
  const { level, xp, streakDays, lessonsCount, reflectionsCount, enrollmentsCount } = questData

  const xpInLevel = xp % 500
  const xpNeeded = 500
  const progressPercent = Math.round((xpInLevel / xpNeeded) * 100)

  // ── Missions ──────────────────────────────────────────────────────────
  const quests = [
    {
      id: 1,
      title: "El Despertar",
      description: "Entra a la plataforma por primera vez y descubre tu destino.",
      xpReward: 50,
      icon: Compass,
      completed: true,
    },
    {
      id: 2,
      title: "La Primera Sangre",
      description: "Completa exitosamente tu primera lección en la Biblioteca.",
      xpReward: 150,
      icon: Sword,
      completed: questData.hasCompletedLesson,
    },
    {
      id: 3,
      title: "Voz del Pueblo",
      description: "Publica tu primer pensamiento o duda en La Taberna.",
      xpReward: 100,
      icon: Target,
      completed: questData.hasReflection,
    },
  ]

  const completedCount = quests.filter((q) => q.completed).length

  // ── Achievements ──────────────────────────────────────────────────────
  const achievements: Achievement[] = [
    {
      id: "awakening",
      title: "El Despertar",
      description: "Diste tus primeros pasos en Ainara",
      icon: Compass,
      xpReward: 0,
      tier: "bronze",
      unlocked: true,
    },
    {
      id: "first_lesson",
      title: "Primera Sangre",
      description: "Completaste tu primera lección",
      icon: Sword,
      xpReward: 150,
      tier: "bronze",
      unlocked: lessonsCount >= 1,
    },
    {
      id: "first_voice",
      title: "Voz del Pueblo",
      description: "Compartiste tu primera reflexión",
      icon: MessageSquare,
      xpReward: 100,
      tier: "bronze",
      unlocked: reflectionsCount >= 1,
    },
    {
      id: "explorer",
      title: "Explorador",
      description: "Inscrito en 2 formaciones",
      icon: Map,
      xpReward: 150,
      tier: "bronze",
      unlocked: enrollmentsCount >= 2,
    },
    {
      id: "apprentice",
      title: "Aprendiz Dedicado",
      description: "Completaste 5 lecciones",
      icon: BookOpen,
      xpReward: 200,
      tier: "silver",
      unlocked: lessonsCount >= 5,
    },
    {
      id: "fire_streak",
      title: "Llama Interna",
      description: "Racha de 7 días consecutivos",
      icon: Flame,
      xpReward: 250,
      tier: "silver",
      unlocked: streakDays >= 7,
    },
    {
      id: "collector",
      title: "Coleccionista",
      description: "Acumulaste 1,000 XP",
      icon: Star,
      xpReward: 0,
      tier: "silver",
      unlocked: xp >= 1000,
    },
    {
      id: "warrior",
      title: "Guerrero del Saber",
      description: "Completaste 10 lecciones",
      icon: Zap,
      xpReward: 500,
      tier: "silver",
      unlocked: lessonsCount >= 10,
    },
    {
      id: "level5",
      title: "Ascensión",
      description: "Alcanzaste el Nivel 5",
      icon: TrendingUp,
      xpReward: 300,
      tier: "gold",
      unlocked: level >= 5,
    },
    {
      id: "legend",
      title: "Leyenda",
      description: "Nivel 10 — cúspide de la comunidad",
      icon: Crown,
      xpReward: 1000,
      tier: "gold",
      unlocked: level >= 10,
    },
  ]

  const unlockedCount = achievements.filter((a) => a.unlocked).length

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-16 relative animation-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 sm:p-10 rounded-3xl bg-card/60 backdrop-blur-xl border border-border/50 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary/10 rounded-full blur-[80px] -z-10" />

        <div className="flex-1 space-y-4 text-center md:text-left">
          <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none px-3 py-1 text-xs tracking-widest uppercase mb-2">
            Diario de Misiones
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Tu Gran{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
              Aventura
            </span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto md:mx-0">
            Forja tu leyenda. Completa misiones para ganar conocimiento, experiencia y subir de nivel.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-background/80 shadow-inner border border-border/50 w-full md:w-64 shrink-0">
          <div className="relative">
            <Trophy className="w-16 h-16 text-primary drop-shadow-lg" />
            <div className="absolute -bottom-2 -right-2 bg-foreground text-background text-xs font-bold px-2 py-1 rounded-md border-2 border-background">
              NIVEL {level}
            </div>
          </div>

          <div className="w-full mt-6 space-y-2">
            <div className="flex justify-between text-xs font-bold text-muted-foreground">
              <span>{xpInLevel} XP</span>
              <span>{xpNeeded} XP</span>
            </div>
            <Progress value={progressPercent} className="h-3 bg-primary/20" />
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Misiones */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Map className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-semibold">Misiones Activas</h2>
            <Badge variant="outline" className="ml-auto bg-card">
              {completedCount}/{quests.length} Completadas
            </Badge>
          </div>

          <div className="space-y-4 relative">
            <div className="absolute left-7 top-8 bottom-8 w-0.5 bg-border/50 hidden sm:block -z-10" />

            {quests.map((quest) => (
              <Card
                key={quest.id}
                className={cn(
                  "relative border transition-all duration-300 shadow-sm",
                  quest.completed
                    ? "bg-muted/30 border-border/40 opacity-70 hover:opacity-100"
                    : "bg-card/80 backdrop-blur-md border-border hover:border-primary/50 hover:shadow-md"
                )}
              >
                <CardContent className="p-4 sm:p-6 flex items-start gap-4 sm:gap-6">
                  <div
                    className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center shrink-0 border-4 border-background shadow-sm z-10 transition-colors",
                      quest.completed ? "bg-emerald-500 text-white" : "bg-primary/10 text-primary"
                    )}
                  >
                    {quest.completed ? <Award className="w-6 h-6" /> : <quest.icon className="w-6 h-6" />}
                  </div>

                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <h3
                        className={cn(
                          "text-lg font-bold truncate",
                          quest.completed
                            ? "text-muted-foreground line-through decoration-emerald-500/50"
                            : "text-foreground"
                        )}
                      >
                        {quest.title}
                      </h3>
                      <Badge
                        className={cn(
                          "w-fit border-none font-bold",
                          quest.completed
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-primary/10 text-primary"
                        )}
                      >
                        +{quest.xpReward} XP
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{quest.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Logros */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-border/50 bg-card/40 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary fill-primary/20" /> Insignias
                </span>
                <Badge variant="outline" className="text-xs font-normal">
                  {unlockedCount}/{achievements.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pr-3">
              {achievements.map((ach) => {
                const Icon = ach.icon
                return (
                  <div
                    key={ach.id}
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200",
                      ach.unlocked
                        ? cn("bg-card", TIER_BG[ach.tier])
                        : "bg-muted/20 border-border/30 opacity-50 grayscale"
                    )}
                  >
                    <div
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                        ach.unlocked ? TIER_BG[ach.tier] : "bg-muted"
                      )}
                    >
                      {ach.unlocked ? (
                        <Icon className={cn("w-4 h-4", TIER_COLORS[ach.tier])} />
                      ) : (
                        <Lock className="w-4 h-4 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{ach.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{ach.description}</p>
                    </div>
                    {ach.unlocked && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
