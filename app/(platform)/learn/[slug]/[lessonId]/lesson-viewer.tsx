"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  BookOpen,
  List,
  X,
  Sparkles,
  MessageSquare,
  Play
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface LessonViewerProps {
  data: {
    lesson: {
      id: string
      title: string
      description: string | null
      videoUrl: string | null
      durationSeconds: number | null
      xpReward: number
      isCompleted: boolean
      watchedSeconds: number
    }
    module: {
      id: string
      title: string
      order: number
    }
    formation: {
      id: string
      title: string
      slug: string
    }
    curriculum: Array<{
      id: string
      title: string
      order: number
      lessons: Array<{
        id: string
        title: string
        isCompleted: boolean
        isCurrent: boolean
      }>
    }>
    previousLesson: { id: string; title: string } | null
    nextLesson: { id: string; title: string } | null
    completedCount: number
    totalCount: number
  }
}

export function LessonViewer({ data }: LessonViewerProps) {
  const router = useRouter()
  const [showSidebar, setShowSidebar] = useState(false)
  const [lessonCompleted, setLessonCompleted] = useState(data.lesson.isCompleted)
  const [isSaving, setIsSaving] = useState(false)
  
  const { lesson, module, formation, curriculum, previousLesson, nextLesson, completedCount, totalCount } = data
  const progressPercent = Math.round((completedCount / totalCount) * 100)

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0 min"
    const minutes = Math.floor(seconds / 60)
    return `${minutes} min`
  }

  const saveProgress = useCallback(async (watchedSeconds: number, completed: boolean = false) => {
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: lesson.id,
          watchedSeconds,
          isCompleted: completed,
        }),
      })
      
      if (completed && !lessonCompleted) {
        setLessonCompleted(true)
      }
    } catch (error) {
      console.error("Error saving progress:", error)
    }
  }, [lesson.id, lessonCompleted])

  const handleMarkComplete = async () => {
    setIsSaving(true)
    await saveProgress(lesson.durationSeconds || 0, true)
    setIsSaving(false)
    
    // If there's a next lesson, navigate to it
    if (nextLesson) {
      router.push(`/learn/${formation.slug}/${nextLesson.id}`)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-4">
            <Link href={`/formations/${formation.slug}`}>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-6 bg-border/50" />
            <div>
              <p className="text-sm font-medium truncate max-w-[300px] text-foreground">
                {formation.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {module.title}
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
              className="border-border/50"
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
          {/* Video Player Area */}
          <div className="bg-gradient-to-b from-charcoal to-charcoal-light">
            <div className="max-w-5xl mx-auto">
              <div className="aspect-video flex items-center justify-center">
                {lesson.videoUrl ? (
                  <video
                    src={lesson.videoUrl}
                    controls
                    className="w-full h-full"
                    onTimeUpdate={(e) => {
                      const video = e.currentTarget
                      // Save progress every 30 seconds
                      if (Math.floor(video.currentTime) % 30 === 0 && video.currentTime > 0) {
                        saveProgress(Math.floor(video.currentTime))
                      }
                      // Auto-complete at 90%
                      if (!lessonCompleted && video.duration && video.currentTime / video.duration >= 0.9) {
                        saveProgress(Math.floor(video.currentTime), true)
                      }
                    }}
                    onEnded={() => {
                      if (!lessonCompleted) {
                        saveProgress(lesson.durationSeconds || 0, true)
                      }
                    }}
                  />
                ) : (
                  <div className="text-center text-white/60">
                    <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                      <Play className="h-12 w-12" />
                    </div>
                    <p className="text-lg">Video no disponible</p>
                    <p className="text-sm mt-2">El contenido de video se agregara pronto</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lesson Content */}
          <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Lesson Header */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="border-border/50 text-muted-foreground">
                    Modulo {module.order}: {module.title}
                  </Badge>
                  {lessonCompleted && (
                    <Badge className="bg-emerald-500 text-white border-0">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Completada
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl font-medium text-foreground">{lesson.title}</h1>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>+{lesson.xpReward} XP</span>
              </div>
            </div>

            {/* Mark as Complete Button (if no video or not completed) */}
            {!lessonCompleted && (
              <Card className="mb-6 border-primary/20 bg-primary/5">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Marcar como completada</p>
                      <p className="text-sm text-muted-foreground">
                        {lesson.videoUrl 
                          ? "O ve el video hasta el 90% para completar automaticamente"
                          : "Marca esta leccion como completada para continuar"}
                      </p>
                    </div>
                    <Button 
                      onClick={handleMarkComplete}
                      disabled={isSaving}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {isSaving ? "Guardando..." : "Completar"}
                      <CheckCircle2 className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            {lesson.description && (
              <Card className="mb-6 border-border/50 bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">Acerca de esta leccion</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{lesson.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Comments Section Placeholder */}
            <Card className="mb-6 border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Comentarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-8 w-8 text-primary/60" />
                  </div>
                  <p>Los comentarios estaran disponibles proximamente</p>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-border/50">
              {previousLesson ? (
                <Link href={`/learn/${formation.slug}/${previousLesson.id}`}>
                  <Button variant="outline" className="border-border/50 hover:border-primary/30">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">{previousLesson.title}</span>
                    <span className="sm:hidden">Anterior</span>
                  </Button>
                </Link>
              ) : (
                <div />
              )}
              
              {nextLesson ? (
                <Link href={`/learn/${formation.slug}/${nextLesson.id}`}>
                  <Button className="bg-primary hover:bg-primary/90">
                    <span className="hidden sm:inline">{nextLesson.title}</span>
                    <span className="sm:hidden">Siguiente</span>
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              ) : (
                <Link href={`/formations/${formation.slug}`}>
                  <Button className="bg-primary hover:bg-primary/90">
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
            "fixed inset-y-0 right-0 z-40 w-80 bg-background border-l border-border/50 transform transition-transform duration-200 md:relative md:translate-x-0",
            showSidebar ? "translate-x-0" : "translate-x-full md:translate-x-0"
          )}
        >
          <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-foreground">Contenido del curso</h3>
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
                  <span className="text-muted-foreground">Progreso</span>
                  <span className="font-medium text-primary">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              {/* Modules */}
              <div className="space-y-4">
                {curriculum.map((mod) => (
                  <div key={mod.id}>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Modulo {mod.order}: {mod.title}
                    </h4>
                    <div className="space-y-1">
                      {mod.lessons.map((l, lessonIndex) => (
                        <Link
                          key={l.id}
                          href={`/learn/${formation.slug}/${l.id}`}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-lg text-sm transition-colors",
                            l.isCurrent
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-primary/5"
                          )}
                        >
                          <div
                            className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                              l.isCompleted
                                ? "bg-emerald-500/10 text-emerald-600"
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
                          <span className={cn(
                            "truncate",
                            l.isCurrent ? "text-primary-foreground" : "text-foreground"
                          )}>
                            {l.title}
                          </span>
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
