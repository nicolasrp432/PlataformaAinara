"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  BookOpen,
  List,
  X,
  Star,
  MessageSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { VideoPlayer } from "@/components/video/video-player"
import { cn } from "@/lib/utils"

// Mock data
const mockLesson = {
  id: "l6",
  title: "El ego y sus mecanismos",
  description: "En esta leccion exploraremos como funciona el ego, sus mecanismos de defensa y como estos patrones influyen en nuestra vida cotidiana. Aprenderemos a reconocer cuando el ego esta actuando y como podemos observarlo sin juzgar.",
  videoUrl: "https://customer-xxx.cloudflarestream.com/video-id/manifest/video.m3u8",
  duration: 2100,
  xpReward: 30,
  isCompleted: false,
  module: {
    id: "m2",
    title: "Patrones y Condicionamientos",
    order: 2,
  },
  formation: {
    id: "1",
    title: "Despertar de la Consciencia",
    slug: "despertar-consciencia",
    progress: 45,
  },
  resources: [
    { id: "r1", title: "Guia de autoobservacion", type: "pdf", url: "#" },
    { id: "r2", title: "Diario de patrones", type: "pdf", url: "#" },
  ],
  previousLesson: { id: "l5", title: "Reconociendo patrones" },
  nextLesson: { id: "l7", title: "Creencias limitantes" },
}

const mockCurriculum = [
  {
    id: "m1",
    title: "Fundamentos de la Consciencia",
    lessons: [
      { id: "l1", title: "Que es la consciencia", isCompleted: true, isCurrent: false },
      { id: "l2", title: "Niveles de consciencia", isCompleted: true, isCurrent: false },
      { id: "l3", title: "El observador interno", isCompleted: true, isCurrent: false },
      { id: "l4", title: "Practica: Primera observacion", isCompleted: true, isCurrent: false },
    ],
  },
  {
    id: "m2",
    title: "Patrones y Condicionamientos",
    lessons: [
      { id: "l5", title: "Reconociendo patrones", isCompleted: true, isCurrent: false },
      { id: "l6", title: "El ego y sus mecanismos", isCompleted: false, isCurrent: true },
      { id: "l7", title: "Creencias limitantes", isCompleted: false, isCurrent: false },
      { id: "l8", title: "Heridas emocionales", isCompleted: false, isCurrent: false },
      { id: "l9", title: "Practica: Mapa de patrones", isCompleted: false, isCurrent: false },
    ],
  },
  {
    id: "m3",
    title: "Practicas de Despertar",
    lessons: [
      { id: "l10", title: "Meditacion guiada", isCompleted: false, isCurrent: false },
      { id: "l11", title: "Respiracion consciente", isCompleted: false, isCurrent: false },
      { id: "l12", title: "Integracion y cierre", isCompleted: false, isCurrent: false },
    ],
  },
]

export default function LessonViewerPage() {
  const params = useParams()
  const router = useRouter()
  const [showSidebar, setShowSidebar] = useState(false)
  const [lessonCompleted, setLessonCompleted] = useState(false)
  
  const lesson = mockLesson // In real app, fetch by params

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    return `${minutes} min`
  }

  const handleVideoComplete = () => {
    setLessonCompleted(true)
    // In real app, save progress to backend
  }

  const handleVideoProgress = (progress: number, duration: number) => {
    // Save progress every 10 seconds
    console.log("Progress:", Math.round((progress / duration) * 100), "%")
  }

  const completedCount = mockCurriculum.reduce(
    (acc, m) => acc + m.lessons.filter((l) => l.isCompleted).length,
    0
  )
  const totalCount = mockCurriculum.reduce((acc, m) => acc + m.lessons.length, 0)
  const progressPercent = Math.round((completedCount / totalCount) * 100)

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-4">
            <Link href={`/formations/${lesson.formation.slug}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <p className="text-sm font-medium truncate max-w-[300px]">
                {lesson.formation.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {lesson.module.title}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              <Progress value={progressPercent} className="w-32 h-2" />
              <span className="text-sm text-muted-foreground">
                {completedCount}/{totalCount}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <List className="h-4 w-4 mr-2" />
              Contenido
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Video Player */}
          <div className="bg-black">
            <div className="max-w-5xl mx-auto">
              <VideoPlayer
                src={lesson.videoUrl}
                title={lesson.title}
                lessonId={lesson.id}
                onComplete={handleVideoComplete}
                onProgress={handleVideoProgress}
                autoTrackProgress
              />
            </div>
          </div>

          {/* Lesson Content */}
          <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Lesson Header */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">
                    Modulo {lesson.module.order}: {lesson.module.title}
                  </Badge>
                  {lessonCompleted && (
                    <Badge className="bg-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Completada
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl font-bold">{lesson.title}</h1>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="h-4 w-4 text-secondary" />
                <span>+{lesson.xpReward} XP</span>
              </div>
            </div>

            {/* Description */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Acerca de esta leccion</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{lesson.description}</p>
              </CardContent>
            </Card>

            {/* Resources */}
            {lesson.resources.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Recursos de la leccion
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {lesson.resources.map((resource) => (
                      <a
                        key={resource.id}
                        href={resource.url}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
                      >
                        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{resource.title}</p>
                          <p className="text-sm text-muted-foreground uppercase">
                            {resource.type}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comments Section Placeholder */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comentarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Los comentarios estaran disponibles proximamente</p>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t">
              {lesson.previousLesson ? (
                <Link href={`/learn/${lesson.formation.slug}/${lesson.previousLesson.id}`}>
                  <Button variant="outline">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    {lesson.previousLesson.title}
                  </Button>
                </Link>
              ) : (
                <div />
              )}
              
              {lesson.nextLesson ? (
                <Link href={`/learn/${lesson.formation.slug}/${lesson.nextLesson.id}`}>
                  <Button>
                    {lesson.nextLesson.title}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              ) : (
                <Link href={`/formations/${lesson.formation.slug}`}>
                  <Button>
                    Finalizar formacion
                    <CheckCircle2 className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </main>

        {/* Sidebar - Curriculum */}
        <aside
          className={cn(
            "fixed inset-y-0 right-0 z-40 w-80 bg-background border-l transform transition-transform duration-200 md:relative md:translate-x-0",
            showSidebar ? "translate-x-0" : "translate-x-full md:translate-x-0"
          )}
        >
          <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Contenido del curso</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setShowSidebar(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Progreso</span>
                  <span className="font-medium">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              {/* Modules */}
              <div className="space-y-4">
                {mockCurriculum.map((module, moduleIndex) => (
                  <div key={module.id}>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Modulo {moduleIndex + 1}: {module.title}
                    </h4>
                    <div className="space-y-1">
                      {module.lessons.map((l, lessonIndex) => (
                        <Link
                          key={l.id}
                          href={`/learn/${lesson.formation.slug}/${l.id}`}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-lg text-sm transition-colors",
                            l.isCurrent
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          )}
                        >
                          <div
                            className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                              l.isCompleted
                                ? "bg-green-500/10 text-green-600"
                                : l.isCurrent
                                ? "bg-white/20 text-white"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {l.isCompleted ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              lessonIndex + 1
                            )}
                          </div>
                          <span className="truncate">{l.title}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}
    </div>
  )
}
