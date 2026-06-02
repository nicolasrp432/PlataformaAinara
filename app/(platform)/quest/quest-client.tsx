"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Trophy, Award, Lock, CheckCircle2, Star, Flame, Compass,
  Sword, Target, Map, MessageSquare, Zap, TrendingUp, Crown, BookOpen
} from "lucide-react"
import { cn } from "@/lib/utils"

interface QuestClientProps {
  questData: {
    level: number
    xp: number
    streakDays: number
    lessonsCount: number
    reflectionsCount: number
    enrollmentsCount: number
    hasReflection: boolean
    hasCompletedLesson: boolean
  }
}

const TIER_COLORS = {
  bronze: "text-amber-600 border-amber-500/20 bg-amber-500/5",
  silver: "text-slate-400 border-slate-400/20 bg-slate-400/5",
  gold: "text-primary border-primary/20 bg-primary/5",
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 25,
    }
  },
}

export function QuestClient({ questData }: QuestClientProps) {
  const { level, xp, streakDays, lessonsCount, reflectionsCount, enrollmentsCount } = questData

  const xpInLevel = xp % 500
  const xpNeeded = 500
  const progressPercent = Math.round((xpInLevel / xpNeeded) * 100)

  // ── Misiones Dinámicas ──────────────────────────────────────────────────
  const quests = [
    {
      id: 1,
      title: "El Despertar",
      description: "Entra a la plataforma por primera vez y descubre tu destino.",
      xpReward: 50,
      icon: Compass,
      completed: true,
      hint: "¡Completado al registrarte!",
    },
    {
      id: 2,
      title: "La Primera Sangre",
      description: "Completa exitosamente tu primera lección en la Biblioteca.",
      xpReward: 150,
      icon: Sword,
      completed: questData.hasCompletedLesson,
      hint: "Ve a la biblioteca y marca tu primera lección como completada.",
    },
    {
      id: 3,
      title: "Voz del Pueblo",
      description: "Publica tu primer pensamiento o duda en la Comunidad.",
      xpReward: 100,
      icon: Target,
      completed: questData.hasReflection,
      hint: "Comparte tus resonancias en la sección de Comunidad.",
    },
  ]

  // ── Logros / Insignias Dinámicas ─────────────────────────────────────────
  const achievements = [
    {
      id: "awakening",
      title: "El Despertar",
      description: "Diste tus primeros pasos en la plataforma.",
      icon: Compass,
      tier: "bronze" as const,
      unlocked: true,
      requirement: "Registrarse en la plataforma",
    },
    {
      id: "first_lesson",
      title: "Primera Sangre",
      description: "Completaste tu primera lección.",
      icon: Sword,
      tier: "bronze" as const,
      unlocked: lessonsCount >= 1,
      requirement: "Completar 1 lección",
    },
    {
      id: "first_voice",
      title: "Voz del Pueblo",
      description: "Compartiste tu primera reflexión.",
      icon: MessageSquare,
      tier: "bronze" as const,
      unlocked: reflectionsCount >= 1,
      requirement: "Publicar 1 reflexión en Comunidad",
    },
    {
      id: "explorer",
      title: "Explorador",
      description: "Te inscribiste en al menos 2 formaciones.",
      icon: Map,
      tier: "bronze" as const,
      unlocked: enrollmentsCount >= 2,
      requirement: "Inscribirse en 2 formaciones",
    },
    {
      id: "apprentice",
      title: "Aprendiz Dedicado",
      description: "Completaste 5 lecciones de crecimiento.",
      icon: BookOpen,
      tier: "silver" as const,
      unlocked: lessonsCount >= 5,
      requirement: `Completar 5 lecciones (Llevas ${lessonsCount}/5)`,
    },
    {
      id: "fire_streak",
      title: "Llama Interna",
      description: "Racha de 7 días consecutivos activos.",
      icon: Flame,
      tier: "silver" as const,
      unlocked: streakDays >= 7,
      requirement: `Racha de 7 días (Tu racha: ${streakDays}d)`,
    },
    {
      id: "collector",
      title: "Coleccionista",
      description: "Acumulaste tus primeros 1,000 XP.",
      icon: Star,
      tier: "silver" as const,
      unlocked: xp >= 1000,
      requirement: `Acumular 1000 XP (Tienes ${xp} XP)`,
    },
    {
      id: "warrior",
      title: "Guerrero del Saber",
      description: "Completaste 10 lecciones con éxito.",
      icon: Zap,
      tier: "silver" as const,
      unlocked: lessonsCount >= 10,
      requirement: `Completar 10 lecciones (Llevas ${lessonsCount}/10)`,
    },
    {
      id: "level5",
      title: "Ascensión",
      description: "Alcanzaste el Nivel 5 de evolución.",
      icon: TrendingUp,
      tier: "gold" as const,
      unlocked: level >= 5,
      requirement: `Alcanzar el nivel 5 (Eres nivel ${level})`,
    },
    {
      id: "legend",
      title: "Leyenda de la Matriz",
      description: "Nivel 10 — cúspide del conocimiento.",
      icon: Crown,
      tier: "gold" as const,
      unlocked: level >= 10,
      requirement: `Alcanzar el nivel 10 (Eres nivel ${level})`,
    },
  ]

  const completedQuestsCount = quests.filter((q) => q.completed).length
  const unlockedCount = achievements.filter((a) => a.unlocked).length

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-16 relative">
      {/* Background ambient glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* ── TOP HEADER HERO ──────────────────────────────────────────────── */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row items-center justify-between gap-8 p-6 sm:p-10 rounded-3xl bg-card/60 backdrop-blur-xl border border-border/50 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-[80px] pointer-events-none -z-10" />
        
        <div className="flex-1 space-y-4 text-center md:text-left">
          <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 px-3.5 py-1 text-xs tracking-widest uppercase mb-1">
            Progreso Cósmico
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-foreground">
            Tus <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">Logros</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md leading-relaxed mx-auto md:mx-0">
            Forja tu propia leyenda. Cumple misiones diarias y semanales, acumula experiencia y desbloquea insignias que marcan tu evolución interior.
          </p>
        </div>

        {/* Circular Progress Gauge */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-background/80 border border-border/50 w-full md:w-72 shadow-xl shrink-0 group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-secondary border border-border/60 shadow-lg">
            <Trophy className="w-10 h-10 text-primary drop-shadow-md transition-transform duration-300 group-hover:scale-110" />
            <div className="absolute -bottom-2 bg-foreground text-background text-[10px] font-bold px-2 py-0.5 rounded-md border border-background shadow-md">
              NIVEL {level}
            </div>
            
            {/* SVG circular track */}
            <svg className="absolute inset-0 h-24 w-24 -rotate-90" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary/10" />
              <motion.circle
                cx="16" cy="16" r="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeDasharray={`${2 * Math.PI * 14}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 14 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 14 * (1 - progressPercent / 100) }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                strokeLinecap="round"
                className="text-primary"
              />
            </svg>
          </div>

          <div className="w-full mt-6 space-y-2 relative z-10">
            <div className="flex justify-between text-xs font-bold text-muted-foreground">
              <span>{xpInLevel} XP</span>
              <span className="text-primary">{progressPercent}%</span>
              <span>{xpNeeded} XP</span>
            </div>
            <Progress value={progressPercent} className="h-2 bg-primary/20" />
            <p className="text-[10px] text-center text-muted-foreground pt-1">
              Faltan {xpNeeded - xpInLevel} XP para el nivel {level + 1}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── INTERACTIVE TAB SELECTOR ───────────────────────────────────── */}
      <Tabs defaultValue="quests" className="space-y-8">
        <TabsList className="bg-muted/50 p-1.5 rounded-2xl h-auto w-full max-w-md mx-auto flex">
          <TabsTrigger value="quests" className="rounded-xl py-2.5 flex-1 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all font-semibold text-sm gap-2">
            <Compass className="w-4 h-4" /> Misiones ({completedQuestsCount}/{quests.length})
          </TabsTrigger>
          <TabsTrigger value="badges" className="rounded-xl py-2.5 flex-1 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all font-semibold text-sm gap-2">
            <Award className="w-4 h-4" /> Insignias ({unlockedCount}/{achievements.length})
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: MISIONES ────────────────────────────────────────────── */}
        <TabsContent value="quests" className="outline-none focus:ring-0">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-6 md:grid-cols-3"
          >
            <div className="md:col-span-3 space-y-4">
              {quests.map((quest) => (
                <motion.div
                  key={quest.id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.01 }}
                  className={cn(
                    "relative border rounded-2xl transition-all duration-300 shadow-sm overflow-hidden",
                    quest.completed
                      ? "bg-muted/20 border-border/40 opacity-70"
                      : "bg-card/70 backdrop-blur-md border-border hover:border-primary/45 hover:shadow-lg"
                  )}
                >
                  <CardContent className="p-5 sm:p-6 flex items-start gap-4 sm:gap-6">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-4 border-background shadow-md transition-all",
                        quest.completed ? "bg-emerald-500 text-white" : "bg-primary/10 text-primary"
                      )}
                    >
                      {quest.completed ? <CheckCircle2 className="w-5 h-5" /> : <quest.icon className="w-5 h-5" />}
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <h3
                          className={cn(
                            "text-base sm:text-lg font-semibold truncate leading-none",
                            quest.completed
                              ? "text-muted-foreground line-through decoration-emerald-500/50"
                              : "text-foreground"
                          )}
                        >
                          {quest.title}
                        </h3>
                        <Badge
                          className={cn(
                            "w-fit border-none font-bold text-xs px-2.5 py-0.5 transition-colors",
                            quest.completed
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-primary/10 text-primary"
                          )}
                        >
                          +{quest.xpReward} XP
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {quest.description}
                      </p>
                      {!quest.completed && (
                        <p className="text-[10px] text-primary/80 font-medium mt-2 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" /> {quest.hint}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        {/* ── TAB 2: INSIGNIAS / LOGROS ───────────────────────────────────── */}
        <TabsContent value="badges" className="outline-none focus:ring-0">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {achievements.map((ach) => {
              const Icon = ach.icon
              return (
                <motion.div
                  key={ach.id}
                  variants={itemVariants}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className={cn(
                    "relative border rounded-2xl p-4 sm:p-5 transition-all duration-300 shadow-sm flex flex-col justify-between overflow-hidden",
                    ach.unlocked
                      ? cn("bg-card border-border hover:shadow-lg hover:border-primary/30", TIER_BG_SHADOW[ach.tier])
                      : "bg-muted/10 border-border/30 opacity-40 grayscale"
                  )}
                >
                  {/* Subtle tier ambient glow inside unlocked cards */}
                  {ach.unlocked && (
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />
                  )}

                  <div className="space-y-4">
                    {/* Top line with Icon and Tier Badge */}
                    <div className="flex items-center justify-between">
                      <div
                        className={cn(
                          "w-11 h-11 rounded-full flex items-center justify-center shrink-0 border border-border/40 shadow-inner",
                          ach.unlocked ? TIER_COLORS[ach.tier] : "bg-muted text-muted-foreground/30"
                        )}
                      >
                        {ach.unlocked ? (
                          <Icon className="w-5 h-5" />
                        ) : (
                          <Lock className="w-4 h-4 text-muted-foreground/30" />
                        )}
                      </div>
                      
                      {ach.unlocked ? (
                        <Badge variant="outline" className={cn("text-[9px] uppercase font-bold tracking-wider", TIER_COLORS[ach.tier])}>
                          {ach.tier}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] bg-muted/30 text-muted-foreground/50 border-none">
                          Bloqueado
                        </Badge>
                      )}
                    </div>

                    {/* Title and description */}
                    <div className="space-y-1">
                      <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-1.5">
                        {ach.unlocked ? ach.title : "Insignia Oculta"}
                        {ach.unlocked && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {ach.unlocked ? ach.description : "Continúa explorando tu camino para revelar este logro."}
                      </p>
                    </div>
                  </div>

                  {/* Requirements display at bottom */}
                  <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground/80 font-medium">
                    <span className="truncate pr-1">
                      Requisito: {ach.requirement}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

const TIER_BG_SHADOW = {
  bronze: "hover:shadow-amber-500/5",
  silver: "hover:shadow-slate-400/5",
  gold: "hover:shadow-primary/10",
}
