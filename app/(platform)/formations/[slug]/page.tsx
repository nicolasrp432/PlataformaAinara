"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, 
  Play, 
  Clock, 
  BookOpen, 
  Star, 
  Users, 
  Lock,
  CheckCircle2,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

// Mock data
const mockFormation = {
  id: "1",
  title: "Despertar de la Consciencia",
  slug: "despertar-consciencia",
  description: "Un viaje profundo hacia el autoconocimiento y la transformacion interior. Descubre las claves para despertar tu consciencia y vivir con mayor plenitud, presencia y proposito.",
  longDescription: `Esta formacion te guiara a traves de un proceso transformador donde aprenderas a:

- Comprender la naturaleza de la consciencia
- Identificar los patrones que limitan tu crecimiento
- Desarrollar una practica diaria de autoobservacion
- Conectar con tu esencia mas profunda
- Integrar los aprendizajes en tu vida cotidiana`,
  thumbnail: "/images/formations/despertar.jpg",
  category: "consciousness",
  difficulty: "intermediate",
  duration: 480,
  xpReward: 500,
  isPremium: true,
  isEnrolled: true,
  progress: 45,
  rating: 4.8,
  studentsCount: 234,
  instructor: {
    name: "Ainara",
    avatar: "/images/instructor.jpg",
    bio: "Guia espiritual y facilitadora de procesos de transformacion",
  },
  modules: [
    {
      id: "m1",
      title: "Fundamentos de la Consciencia",
      description: "Comprender los principios basicos",
      lessonsCount: 4,
      duration: 120,
      isCompleted: true,
      lessons: [
        { id: "l1", title: "Que es la consciencia", duration: 900, isCompleted: true, isFree: true },
        { id: "l2", title: "Niveles de consciencia", duration: 1200, isCompleted: true, isFree: false },
        { id: "l3", title: "El observador interno", duration: 1500, isCompleted: true, isFree: false },
        { id: "l4", title: "Practica: Primera observacion", duration: 600, isCompleted: true, isFree: false },
      ],
    },
    {
      id: "m2",
      title: "Patrones y Condicionamientos",
      description: "Identificar lo que nos limita",
      lessonsCount: 5,
      duration: 180,
      isCompleted: false,
      lessons: [
        { id: "l5", title: "Reconociendo patrones", duration: 1800, isCompleted: true, isFree: false },
        { id: "l6", title: "El ego y sus mecanismos", duration: 2100, isCompleted: false, isFree: false },
        { id: "l7", title: "Creencias limitantes", duration: 1500, isCompleted: false, isFree: false },
        { id: "l8", title: "Heridas emocionales", duration: 1800, isCompleted: false, isFree: false },
        { id: "l9", title: "Practica: Mapa de patrones", duration: 900, isCompleted: false, isFree: false },
      ],
    },
    {
      id: "m3",
      title: "Practicas de Despertar",
      description: "Tecnicas y ejercicios",
      lessonsCount: 3,
      duration: 180,
      isCompleted: false,
      lessons: [
        { id: "l10", title: "Meditacion guiada", duration: 1800, isCompleted: false, isFree: false },
        { id: "l11", title: "Respiracion consciente", duration: 1200, isCompleted: false, isFree: false },
        { id: "l12", title: "Integracion y cierre", duration: 900, isCompleted: false, isFree: false },
      ],
    },
  ],
}

export default function FormationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [expandedModules, setExpandedModules] = useState<string[]>(["m1", "m2"])
  
  const formation = mockFormation // In real app, fetch by slug

  const formatDuration = (seconds: number) => {
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
    for (const module of formation.modules) {
      for (const lesson of module.lessons) {
        if (!lesson.isCompleted) {
          return { module, lesson }
        }
      }
    }
    return null
  }

  const nextLesson = findNextLesson()
  const completedLessons = formation.modules.reduce(
    (acc, m) => acc + m.lessons.filter((l) => l.isCompleted).length,
    0
  )
  const totalLessons = formation.modules.reduce((acc, m) => acc + m.lessons.length, 0)

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a la biblioteca
      </Button>

      {/* Hero Section */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Title & Meta */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline">Consciencia</Badge>
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">
                Intermedio
              </Badge>
              {formation.isPremium && (
                <Badge className="bg-secondary">Premium</Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">
              {formation.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              {formation.description}
            </p>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span>{formatDuration(formation.duration * 60)}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <span>{totalLessons} lecciones</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span>{formation.studentsCount} estudiantes</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{formation.rating}</span>
            </div>
          </div>

          {/* Progress (if enrolled) */}
          {formation.isEnrolled && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Tu progreso</span>
                  <span className="text-sm text-muted-foreground">
                    {completedLessons} de {totalLessons} lecciones completadas
                  </span>
                </div>
                <Progress value={formation.progress} className="h-2 mb-4" />
                {nextLesson && (
                  <Link href={`/learn/${formation.slug}/${nextLesson.lesson.id}`}>
                    <Button className="w-full">
                      <Play className="h-4 w-4 mr-2" />
                      Continuar: {nextLesson.lesson.title}
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          {/* About */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Acerca de esta formacion</h2>
            <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
              {formation.longDescription}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* CTA Card */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                    <Play className="h-7 w-7 text-primary ml-1" />
                  </div>
                </div>
              </div>

              {formation.isEnrolled ? (
                <>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Tu progreso</p>
                    <p className="text-2xl font-bold">{formation.progress}%</p>
                  </div>
                  <Link href={`/learn/${formation.slug}/${nextLesson?.lesson.id || formation.modules[0].lessons[0].id}`}>
                    <Button className="w-full" size="lg">
                      <Play className="h-5 w-5 mr-2" />
                      {formation.progress > 0 ? "Continuar" : "Comenzar"}
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <div className="text-center py-2">
                    <p className="text-sm text-muted-foreground mb-1">
                      {formation.isPremium ? "Incluido con Premium" : "Gratis"}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <Star className="h-5 w-5 fill-secondary text-secondary" />
                      <span className="text-lg font-semibold">
                        +{formation.xpReward} XP al completar
                      </span>
                    </div>
                  </div>
                  <Button className="w-full" size="lg">
                    {formation.isPremium ? (
                      <>
                        <Lock className="h-5 w-5 mr-2" />
                        Acceder con Premium
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5 mr-2" />
                        Comenzar Gratis
                      </>
                    )}
                  </Button>
                </>
              )}

              <Separator />

              {/* Instructor */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary">A</span>
                </div>
                <div>
                  <p className="font-medium">{formation.instructor.name}</p>
                  <p className="text-sm text-muted-foreground">Instructora</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Curriculum */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Contenido de la formacion</h2>
        <div className="space-y-3">
          {formation.modules.map((module, moduleIndex) => (
            <Card key={module.id}>
              <button
                className="w-full text-left"
                onClick={() => toggleModule(module.id)}
              >
                <CardHeader className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {expandedModules.includes(module.id) ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <span className="text-muted-foreground">
                            Modulo {moduleIndex + 1}:
                          </span>
                          {module.title}
                          {module.isCompleted && (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {module.lessonsCount} lecciones · {formatDuration(module.duration * 60)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </button>

              {expandedModules.includes(module.id) && (
                <CardContent className="pt-0">
                  <div className="space-y-1 border-t pt-4">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <Link
                        key={lesson.id}
                        href={
                          formation.isEnrolled || lesson.isFree
                            ? `/learn/${formation.slug}/${lesson.id}`
                            : "#"
                        }
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg transition-colors",
                          formation.isEnrolled || lesson.isFree
                            ? "hover:bg-muted"
                            : "cursor-not-allowed opacity-60"
                        )}
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                            lesson.isCompleted
                              ? "bg-green-500/10 text-green-600"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {lesson.isCompleted ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            lessonIndex + 1
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{lesson.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDuration(lesson.duration)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {lesson.isFree && (
                            <Badge variant="outline" className="text-xs">
                              Gratis
                            </Badge>
                          )}
                          {!formation.isEnrolled && !lesson.isFree && (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
