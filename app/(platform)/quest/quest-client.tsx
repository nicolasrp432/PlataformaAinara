"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Trophy, Award, CheckCircle2, Star, Compass,
  Sword, Target,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { computeAchievements } from "@/lib/achievements"
import { AchievementCard } from "@/components/achievements/achievement-badge"

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
  const { level, xp } = questData

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
  const achievements = computeAchievements(questData)

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
            {achievements.map((ach) => (
              <motion.div
                key={ach.id}
                variants={itemVariants}
                whileHover={{ y: -4, scale: 1.02 }}
              >
                <AchievementCard achievement={ach} />
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
