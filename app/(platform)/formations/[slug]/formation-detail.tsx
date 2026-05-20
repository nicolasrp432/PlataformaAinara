"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import Image from "next/image"
import { 
  ArrowLeft, 
  Play, 
  Clock, 
  BookOpen, 
  Lock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface Lesson {
  id: string
  title: string
  description: string | null
  duration_seconds: number | null
  video_url: string | null
  is_free: boolean
  sort_order: number
}

interface Module {
  id: string
  title: string
  description: string | null
  sort_order: number
  lessons: Lesson[]
}

interface Formation {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail_url: string | null
  difficulty: string | null
  duration_minutes: number | null
  xp_reward: number | null
  is_premium: boolean
  modules: Module[]
  isEnrolled: boolean
  progress: number
  completedLessons: string[]
}

interface FormationDetailProps {
  formation: Formation
  isLoggedIn: boolean
}

const difficultyLabels: Record<string, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
}

const difficultyColors: Record<string, string> = {
  beginner: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  intermediate: "bg-amber-500/10 text-amber-700 border-amber-200",
  advanced: "bg-rose-500/10 text-rose-700 border-rose-200",
}

export function FormationDetail({ formation, isLoggedIn }: FormationDetailProps) {
  const router = useRouter()
  const [expandedModules, setExpandedModules] = useState<string[]>(
    formation.modules.slice(0, 2).map((m) => m.id)
  )
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [isEnrolledOptimistic, setIsEnrolledOptimistic] = useState(formation.isEnrolled)

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0 min"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins > 0 ? `${mins}m` : ""}`
  }

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    )
  }

  // Find next lesson to continue
  const findNextLesson = () => {
    for (const moduleItem of formation.modules) {
      for (const lesson of moduleItem.lessons) {
        if (!formation.completedLessons.includes(lesson.id)) {
          return { module: moduleItem, lesson }
        }
      }
    }
    return null
  }

  const nextLesson = findNextLesson()
  const totalLessons = formation.modules.reduce((acc, m) => acc + m.lessons.length, 0)
  const completedCount = formation.completedLessons.length

  const handleEnroll = async () => {
    if (!isLoggedIn) {
      router.push("/login?redirect=" + encodeURIComponent(`/formations/${formation.slug}`))
      return
    }

    setIsEnrolling(true)
    setIsEnrolledOptimistic(true)
    try {
      const res = await fetch("/api/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formationId: formation.id, slug: formation.slug }),
      })

      if (res.ok) {
        toast.success("¡Inscripción exitosa!", { description: "Ya puedes empezar la formación." })
        router.refresh()
      } else {
        setIsEnrolledOptimistic(false)
        toast.error("No se pudo inscribir. Inténtalo de nuevo.")
      }
    } catch (error) {
      console.error("Error enrolling:", error)
      setIsEnrolledOptimistic(false)
      toast.error("Error de conexión. Inténtalo de nuevo.")
    } finally {
      setIsEnrolling(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Link href="/library">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a la biblioteca
        </Button>
      </Link>

      {/* Hero Section — sidebar is first in DOM so it appears first on mobile naturally */}
      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">

        {/* Sidebar — primero en DOM → primero en mobile; col-start-3 en desktop */}
        <div className="lg:col-start-3 lg:row-start-1 space-y-6 min-w-0">
          {/* CTA Card */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardContent className="pt-6 space-y-4">
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg overflow-hidden">
                {formation.thumbnail_url ? (
                  <Image
                    src={formation.thumbnail_url}
                    alt={formation.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-primary/60" />
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-xl">
                    <Play className="h-7 w-7 text-primary ml-1" />
                  </div>
                </div>
              </div>

              {isEnrolledOptimistic ? (
                <>
                  <div className="text-center py-2">
                    <p className="text-sm text-muted-foreground mb-1">Tu progreso</p>
                    <p className="text-3xl font-semibold text-foreground">{formation.progress}%</p>
                  </div>
                  {nextLesson ? (
                    <Link href={`/learn/${formation.slug}/${nextLesson.lesson.id}`} className="block">
                      <Button className="w-full bg-primary hover:bg-primary/90" size="lg">
                        <Play className="h-5 w-5 mr-2" />
                        {formation.progress > 0 ? "Continuar" : "Comenzar"}
                      </Button>
                    </Link>
                  ) : (
                    <Button className="w-full" size="lg" disabled>
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      Completado
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <div className="text-center py-2">
                    <p className="text-sm text-muted-foreground mb-1">
                      {formation.is_premium ? "Formacion Premium" : "Formacion Gratuita"}
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <span className="text-lg font-medium text-foreground">
                        +{formation.xp_reward || 500} XP al completar
                      </span>
                    </div>
                  </div>
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90" 
                    size="lg"
                    onClick={handleEnroll}
                    disabled={isEnrolling}
                  >
                    {isEnrolling ? (
                      "Inscribiendo..."
                    ) : formation.is_premium && !isLoggedIn ? (
                      <>
                        <Lock className="h-5 w-5 mr-2" />
                        Iniciar sesion
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5 mr-2" />
                        {formation.is_premium ? "Inscribirse" : "Comenzar Gratis"}
                      </>
                    )}
                  </Button>
                </>
              )}

              <Separator className="bg-border/50" />

              {/* Instructor */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary">A</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">Ainara</p>
                  <p className="text-sm text-muted-foreground">Instructora</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Left column — segundo en DOM → col 1-2 en desktop vía col-start-1 */}
        <div className="lg:col-span-2 lg:col-start-1 lg:row-start-1 space-y-6 min-w-0">
          {/* Title & Meta */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-medium",
                  difficultyColors[formation.difficulty || "beginner"]
                )}
              >
                {difficultyLabels[formation.difficulty || "beginner"]}
              </Badge>
              {formation.is_premium && (
                <Badge className="bg-primary/90 text-primary-foreground border-0">
                  Premium
                </Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-foreground mb-4">
              {formation.title}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {formation.description || "Una formacion transformadora para tu desarrollo personal."}
            </p>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-5 w-5 text-primary/60" />
              <span>{formatDuration((formation.duration_minutes || 0) * 60)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <BookOpen className="h-5 w-5 text-primary/60" />
              <span>{totalLessons} lecciones</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="h-5 w-5 text-primary/60" />
              <span>+{formation.xp_reward || 500} XP</span>
            </div>
          </div>

          {/* Progress (if enrolled) */}
          {isEnrolledOptimistic && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-2">
                  <span className="font-medium text-foreground">Tu progreso</span>
                  <span className="text-sm text-muted-foreground">
                    {completedCount} de {totalLessons} lecciones completadas
                  </span>
                </div>
                <Progress value={formation.progress} className="h-2 mb-4" />
                {nextLesson && (
                  <Link href={`/learn/${formation.slug}/${nextLesson.lesson.id}`}>
                    <Button className="w-full overflow-hidden bg-primary hover:bg-primary/90">
                      <Play className="h-4 w-4 shrink-0" />
                      <span className="truncate min-w-0 flex-1 text-left">
                        Continuar: {nextLesson.lesson.title}
                      </span>
                    </Button>
                  </Link>
                )}
                {!nextLesson && formation.progress === 100 && (
                  <div className="text-center py-2">
                    <Badge className="bg-emerald-500 text-white border-0">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Formacion completada
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Curriculum */}
      <div>
        <h2 className="text-xl font-medium mb-4 text-foreground">Contenido de la formacion</h2>
        <div className="space-y-3">
          {formation.modules.length === 0 ? (
            <Card className="border-border/50 bg-card/50">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  El contenido de esta formacion estara disponible pronto.
                </p>
              </CardContent>
            </Card>
          ) : (
            formation.modules.map((module, moduleIndex) => {
              const moduleCompletedLessons = module.lessons.filter(
                (l) => formation.completedLessons.includes(l.id)
              ).length
              const isModuleComplete = moduleCompletedLessons === module.lessons.length && module.lessons.length > 0

              return (
                <Card key={module.id} className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                  <button
                    className="w-full text-left"
                    onClick={() => toggleModule(module.id)}
                  >
                    <CardHeader className="py-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="shrink-0">
                            {expandedModules.includes(module.id) ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-sm sm:text-base flex items-center gap-2 text-foreground flex-wrap">
                              <span className="text-muted-foreground font-normal whitespace-nowrap">
                                Modulo {moduleIndex + 1}:
                              </span>
                              <span className="truncate">{module.title}</span>
                              {isModuleComplete && (
                                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 shrink-0" />
                              )}
                            </CardTitle>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                              {module.lessons.length} lecciones
                              {isEnrolledOptimistic && (
                                <span className="ml-2">
                                  · {moduleCompletedLessons}/{module.lessons.length} completadas
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </button>

                  {expandedModules.includes(module.id) && (
                    <CardContent className="pt-0">
                      <div className="space-y-1 border-t border-border/50 pt-4">
                        {module.lessons.map((lesson, lessonIndex) => {
                          const isCompleted = formation.completedLessons.includes(lesson.id)
                          const canAccess = isEnrolledOptimistic || lesson.is_free
                          
                          return (
                            <Link
                              key={lesson.id}
                              href={canAccess ? `/learn/${formation.slug}/${lesson.id}` : "#"}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg transition-colors",
                                canAccess
                                  ? "hover:bg-primary/5"
                                  : "cursor-not-allowed opacity-60"
                              )}
                              onClick={(e) => {
                                if (!canAccess) {
                                  e.preventDefault()
                                  if (!isLoggedIn) {
                                    router.push("/login")
                                  }
                                }
                              }}
                            >
                              <div
                                className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                                  isCompleted
                                    ? "bg-emerald-500/10 text-emerald-600"
                                    : "bg-muted text-muted-foreground"
                                )}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="h-5 w-5" />
                                ) : (
                                  lessonIndex + 1
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={cn(
                                  "font-medium truncate",
                                  isCompleted ? "text-muted-foreground" : "text-foreground"
                                )}>
                                  {lesson.title}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {formatDuration(lesson.duration_seconds)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {lesson.is_free && !formation.isEnrolled && (
                                  <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                                    Gratis
                                  </Badge>
                                )}
                                {!canAccess && (
                                  <Lock className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
