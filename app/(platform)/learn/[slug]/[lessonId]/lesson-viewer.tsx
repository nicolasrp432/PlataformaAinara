"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  List,
  Sparkles,
  MessageSquare,
  Play,
  Send,
  Paperclip,
  Bot,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { addLessonComment, markLessonCompleted } from "./actions"
import { useTransition } from "react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { CommentThread, type ThreadedComment } from "@/components/comments/comment-thread"
import { useUserStore } from "@/lib/store/user-store"
import dynamic from "next/dynamic"

const VideoPlayer = dynamic(() => import("@/components/video/video-player").then((mod) => mod.VideoPlayer), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full aspect-video flex items-center justify-center bg-black/85 rounded-2xl border border-white/5">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-xs text-white/40 tracking-wider">Cargando reproductor...</p>
      </div>
    </div>
  ),
})

const ChatPanel = dynamic(() => import("@/components/ai/chat-panel").then((mod) => mod.ChatPanel), {
  ssr: false,
  loading: () => <div className="h-full w-full shimmer rounded-2xl" />,
})

const ExerciseViewer = dynamic(() => import("@/components/exercises/exercise-viewer").then((mod) => mod.ExerciseViewer), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full shimmer rounded-2xl" />,
})

const QuizPlayer = dynamic(() => import("@/components/exercises/quiz-player").then((mod) => mod.QuizPlayer), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full shimmer rounded-2xl" />,
})


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
      contentType: "video" | "text" | "quiz" | "exercise" | "meditation"
      transcript: string | null
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
    comments?: ThreadedComment[]
  }
  currentUserId: string
}

type Curriculum = LessonViewerProps["data"]["curriculum"]

/* ── Bloques reutilizables (desktop + bottom sheets mobile) ───────────── */

function CurriculumPanel({
  curriculum,
  formationSlug,
  progressPercent,
}: {
  curriculum: Curriculum
  formationSlug: string
  progressPercent: number
}) {
  return (
    <div>
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
                  href={`/learn/${formationSlug}/${l.id}`}
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
  )
}

function CommentsPanel({
  comments,
  commentText,
  onCommentTextChange,
  onSubmit,
  isPending,
  currentUserId,
  lessonId,
  formationSlug,
}: {
  comments: ThreadedComment[]
  commentText: string
  onCommentTextChange: (v: string) => void
  onSubmit: (e: { preventDefault(): void }) => void
  isPending: boolean
  currentUserId: string
  lessonId: string
  formationSlug: string
}) {
  return (
    <div className="space-y-6">
      <div className="bg-card/30 border border-border/50 rounded-2xl p-4">
        <form onSubmit={onSubmit} className="space-y-3">
          <Textarea
            value={commentText}
            onChange={(e) => onCommentTextChange(e.target.value)}
            placeholder="Escribe tu duda, reflexión o comentario aquí..."
            className="w-full resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 p-0 text-base"
            rows={3}
            disabled={isPending}
          />
          <div className="flex justify-end border-t border-border/50 pt-3">
            <Button type="submit" size="sm" disabled={isPending || !commentText.trim()} className="rounded-full px-6">
              <Send className="w-4 h-4 mr-2" />
              {isPending ? "Publicando..." : "Publicar"}
            </Button>
          </div>
        </form>
      </div>

      <div className="pt-4">
        <CommentThread
          comments={comments}
          currentUserId={currentUserId}
          lessonId={lessonId}
          slug={formationSlug}
        />
      </div>
    </div>
  )
}

function AssistantPanel({
  lessonId,
  formationId,
  className,
}: {
  lessonId: string
  formationId: string
  className?: string
}) {
  return (
    <div className={cn("flex flex-col border border-border/50 rounded-2xl p-4 bg-card/30", className)}>
      <ChatPanel lessonId={lessonId} formationId={formationId} className="flex-1" />
    </div>
  )
}

function ResourcesPanel() {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
      <Paperclip className="w-10 h-10 mx-auto mb-3 text-primary/50" />
      <h3 className="text-lg font-medium text-foreground mb-2">Recursos Descargables</h3>
      <p className="text-muted-foreground text-sm max-w-md mx-auto">
        Los cuadernos de trabajo asociados a esta lección estarán disponibles pronto.
      </p>
    </div>
  )
}

export function LessonViewer({ data, currentUserId }: LessonViewerProps) {
  const router = useRouter()
  const { markLessonComplete, addXP } = useUserStore()
  const [lessonCompleted, setLessonCompleted] = useState(data.lesson.isCompleted)
  const [isSaving, setIsSaving] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [comments, setComments] = useState(data.comments || [])
  const [isPending, startTransition] = useTransition()
  const progressDebounceRef = useRef<NodeJS.Timeout | null>(null)

  // Bottom-sheet state (mobile)
  const [openContenido, setOpenContenido] = useState(false)
  const [openComentarios, setOpenComentarios] = useState(false)
  const [openIA, setOpenIA] = useState(false)

  // Sync comments when server provides updated data after router.refresh()
  useEffect(() => {
    setComments(data.comments || [])
  }, [data.comments])

  const { lesson, module, formation, curriculum, previousLesson, nextLesson, completedCount, totalCount } = data
  const progressPercent = Math.round((completedCount / totalCount) * 100)

  const totalCommentCount = comments.reduce(
    (acc, c) => acc + 1 + (c.replies?.length ?? 0),
    0,
  )

  const handleCommentSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault()
    const trimmed = commentText.trim()
    if (!trimmed) return

    // Optimistic update — comment appears immediately at top
    const optimistic: ThreadedComment = {
      id: `temp-${Date.now()}`,
      content: trimmed,
      created_at: new Date().toISOString(),
      user_id: currentUserId,
      parent_id: null,
      profiles: null,
      reactions: {},
      replies: [],
    }
    setComments((prev) => [optimistic, ...prev])
    setCommentText("")

    const formData = new FormData()
    formData.append("content", trimmed)

    startTransition(async () => {
      const result = await addLessonComment(formData, lesson.id, formation.slug)
      if (result?.error) {
        toast.error(result.error)
        setComments((prev) => prev.filter((c) => c.id !== optimistic.id))
        setCommentText(trimmed)
        return
      }
      router.refresh()
    })
  }

  const saveProgress = useCallback(async (watchedSeconds: number, completed: boolean = false) => {
    const doFetch = async () => {
      try {
        await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId: lesson.id, watchedSeconds, isCompleted: completed }),
        })
        if (completed && !lessonCompleted) setLessonCompleted(true)
      } catch (err) {
        console.error("Error saving progress:", err)
      }
    }

    // Completion saves immediately; regular progress is debounced 2s to prevent
    // concurrent requests when the video player fires onProgress at the same time
    // as a manual completion action.
    if (completed) {
      if (progressDebounceRef.current) clearTimeout(progressDebounceRef.current)
      await doFetch()
    } else {
      if (progressDebounceRef.current) clearTimeout(progressDebounceRef.current)
      progressDebounceRef.current = setTimeout(doFetch, 2000)
    }
  }, [lesson.id, lessonCompleted])

  const handleMarkComplete = async () => {
    setIsSaving(true)
    await saveProgress(lesson.durationSeconds || 0, true)
    const result = await markLessonCompleted(lesson.id, formation.slug)
    setIsSaving(false)
    if (result && !result.error && !result.alreadyCompleted) {
      // Optimistic update in global store — XP shows instantly without server roundtrip
      markLessonComplete(lesson.id)
      addXP(result.xpEarned ?? 0, result.leveledUp ?? false)

      toast.success(`¡Lección completada! +${result.xpEarned} XP`, {
        description: result.leveledUp ? "¡Subiste de nivel! 🎉" : undefined,
      })
      if (result.certificateIssued) {
        setTimeout(() => {
          toast.success("🎓 ¡Certificado emitido!", {
            description: "Has completado toda la formación. Revísalo en tu perfil.",
            duration: 6000,
          })
        }, 1500)
      }
      // Refresca el Server Component del layout para actualizar XP/nivel en el sidebar
      router.refresh()
    }
    if (nextLesson) {
      router.push(`/learn/${formation.slug}/${nextLesson.id}`)
    }
  }

  const canMarkComplete =
    !lessonCompleted && lesson.contentType !== "exercise" && lesson.contentType !== "quiz"

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation — z-30 queda por debajo del navbar global (z-50) para
          que éste lo cubra al abrirse; pl-14 deja sitio al botón hamburguesa */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between h-14 px-4 pl-14 md:pl-4 gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link href={`/formations/${formation.slug}`} className="shrink-0">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground px-2 sm:px-3">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline ml-1.5">Volver</span>
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-6 bg-border/50 shrink-0 hidden sm:block" />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate max-w-[150px] sm:max-w-[220px] md:max-w-[300px] text-foreground">
                {formation.title}
              </p>
              <p className="text-xs text-muted-foreground hidden sm:block truncate max-w-[220px] md:max-w-[300px]">
                {module.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="hidden md:flex items-center gap-2">
              <Progress value={progressPercent} className="w-32 h-2" />
              <span className="text-sm text-muted-foreground">
                {completedCount}/{totalCount}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Content Area — renders differently based on content type */}
          {lesson.contentType === "exercise" ? (
            <ExerciseViewer
              lesson={{
                id: lesson.id,
                title: lesson.title,
                description: lesson.description,
                transcript: lesson.transcript,
                xpReward: lesson.xpReward,
                isCompleted: lessonCompleted,
              }}
              isCompleted={lessonCompleted}
              onComplete={handleMarkComplete}
              isSaving={isSaving}
            />
          ) : lesson.contentType === "quiz" ? (
            <QuizPlayer
              lessonId={lesson.id}
              formationSlug={formation.slug}
              formationId={formation.id}
            />
          ) : (
            /* Video/Audio/Text/Meditation — show video player */
            <div className="bg-black overflow-hidden">
              <div className="w-full max-w-5xl mx-auto">
                <div className="aspect-video w-full">
                  {lesson.videoUrl ? (
                    <VideoPlayer
                      src={lesson.videoUrl}
                      title={lesson.title}
                      lessonId={lesson.id}
                      initialProgress={lesson.watchedSeconds}
                      onProgress={(currentTime) => saveProgress(Math.floor(currentTime))}
                      onComplete={() => { if (!lessonCompleted) saveProgress(lesson.durationSeconds || 0, true) }}
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/60">
                      <div className="text-center">
                        <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                          <Play className="h-12 w-12" />
                        </div>
                        <p className="text-lg">Video no disponible</p>
                        <p className="text-sm mt-2">El contenido de video se agregara pronto</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Lesson Content */}
          <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8">
            {/* Lesson Header */}
            <div className="flex items-start justify-between gap-3 mb-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge variant="outline" className="border-border/50 text-muted-foreground text-xs">
                    Modulo {module.order}: {module.title}
                  </Badge>
                  {lessonCompleted && (
                    <Badge className="bg-emerald-500 text-white border-0">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Completada
                    </Badge>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-medium text-foreground">{lesson.title}</h1>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>+{lesson.xpReward} XP</span>
              </div>
            </div>

            {/* Mark as Complete Button — hidden for exercises/quizzes (they have their own complete logic) */}
            {canMarkComplete && (
              <Card className="mb-6 border-primary/20 bg-primary/5">
                <CardContent className="py-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                      className="bg-primary hover:bg-primary/90 self-start sm:self-auto shrink-0"
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

            {/* Comentarios & Recursos — desktop tabs; en mobile se usan los bottom sheets */}
            <Tabs defaultValue="comments" className="mb-6 w-full hidden md:block">
              <TabsList className="bg-muted/50 w-full justify-start p-1 rounded-xl h-auto">
                <TabsTrigger value="comments" className="rounded-lg py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Comentarios ({totalCommentCount})
                </TabsTrigger>
                <TabsTrigger value="resources" className="rounded-lg py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Paperclip className="w-4 h-4 mr-2" />
                  Recursos Extras
                </TabsTrigger>
                <TabsTrigger value="assistant" className="rounded-lg py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Bot className="w-4 h-4 mr-2" />
                  Asistente IA
                </TabsTrigger>
              </TabsList>

              <TabsContent value="comments" className="mt-6 outline-none">
                <CommentsPanel
                  comments={comments}
                  commentText={commentText}
                  onCommentTextChange={setCommentText}
                  onSubmit={handleCommentSubmit}
                  isPending={isPending}
                  currentUserId={currentUserId}
                  lessonId={lesson.id}
                  formationSlug={formation.slug}
                />
              </TabsContent>

              <TabsContent value="assistant" className="mt-6 outline-none">
                <AssistantPanel lessonId={lesson.id} formationId={formation.id} className="h-[520px]" />
              </TabsContent>

              <TabsContent value="resources" className="mt-6 outline-none">
                <ResourcesPanel />
              </TabsContent>
            </Tabs>

            {/* Recursos — visible en mobile (placeholder informativo) */}
            <div className="mb-6 md:hidden">
              <ResourcesPanel />
            </div>

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

        {/* Sidebar - Curriculum (desktop) */}
        <aside className="hidden md:block md:relative md:w-80 bg-background border-l border-border/50">
          <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-foreground">Contenido del curso</h3>
              </div>
              <CurriculumPanel
                curriculum={curriculum}
                formationSlug={formation.slug}
                progressPercent={progressPercent}
              />
            </div>
          </div>
        </aside>
      </div>

      {/* ── Barra de acciones inferior (solo mobile) ─────────────────── */}
      <nav className="fixed bottom-0 inset-x-0 z-30 md:hidden bg-background/95 backdrop-blur-sm border-t border-border/50">
        <div className="flex items-center gap-1 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <button
            onClick={() => setOpenContenido(true)}
            className="flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors"
          >
            <List className="h-5 w-5" />
            <span className="text-[10px] font-medium">Contenido</span>
          </button>

          <button
            onClick={() => setOpenComentarios(true)}
            className="relative flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors"
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-[10px] font-medium">Comentarios</span>
            {totalCommentCount > 0 && (
              <span className="absolute top-0.5 right-1/4 translate-x-1/2 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-semibold flex items-center justify-center">
                {totalCommentCount > 99 ? "99+" : totalCommentCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setOpenIA(true)}
            className="flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors"
          >
            <Bot className="h-5 w-5" />
            <span className="text-[10px] font-medium">Asistente</span>
          </button>

          {/* Acción primaria */}
          {canMarkComplete ? (
            <Button
              onClick={handleMarkComplete}
              disabled={isSaving}
              size="sm"
              className="flex-[1.3] bg-primary hover:bg-primary/90 h-auto py-2 flex-col gap-0.5"
            >
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-[10px] font-medium">{isSaving ? "..." : "Completar"}</span>
            </Button>
          ) : nextLesson ? (
            <Button
              onClick={() => router.push(`/learn/${formation.slug}/${nextLesson.id}`)}
              size="sm"
              className="flex-[1.3] bg-primary hover:bg-primary/90 h-auto py-2 flex-col gap-0.5"
            >
              <ChevronRight className="h-5 w-5" />
              <span className="text-[10px] font-medium">Siguiente</span>
            </Button>
          ) : (
            <Button
              onClick={() => router.push(`/formations/${formation.slug}`)}
              size="sm"
              className="flex-[1.3] bg-primary hover:bg-primary/90 h-auto py-2 flex-col gap-0.5"
            >
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-[10px] font-medium">Finalizar</span>
            </Button>
          )}
        </div>
      </nav>

      {/* ── Bottom sheets (mobile) ───────────────────────────────────── */}
      <Sheet open={openContenido} onOpenChange={setOpenContenido}>
        <SheetContent className="md:hidden">
          <SheetHeader>
            <SheetTitle>Contenido del curso</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto pb-4" onClick={(e) => {
            // Cerrar el sheet al navegar a otra lección
            const target = e.target as HTMLElement
            if (target.closest("a")) setOpenContenido(false)
          }}>
            <CurriculumPanel
              curriculum={curriculum}
              formationSlug={formation.slug}
              progressPercent={progressPercent}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={openComentarios} onOpenChange={setOpenComentarios}>
        <SheetContent className="md:hidden">
          <SheetHeader>
            <SheetTitle>Comentarios ({totalCommentCount})</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto pb-4">
            <CommentsPanel
              comments={comments}
              commentText={commentText}
              onCommentTextChange={setCommentText}
              onSubmit={handleCommentSubmit}
              isPending={isPending}
              currentUserId={currentUserId}
              lessonId={lesson.id}
              formationSlug={formation.slug}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={openIA} onOpenChange={setOpenIA}>
        <SheetContent className="h-[85vh] md:hidden">
          <SheetHeader>
            <SheetTitle>Asistente IA</SheetTitle>
          </SheetHeader>
          <AssistantPanel lessonId={lesson.id} formationId={formation.id} className="flex-1 min-h-0" />
        </SheetContent>
      </Sheet>
    </div>
  )
}
