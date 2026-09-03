"use client"

import { useState, useRef, useCallback, useEffect, useTransition } from "react"
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
  Share2,
  Lightbulb,
  Lock,
} from "lucide-react"
import type { ContentType } from "@/types"
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
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { CommentThread, type ThreadedComment } from "@/components/comments/comment-thread"
import { useUserStore } from "@/lib/store/user-store"
import dynamic from "next/dynamic"

const VideoPlayer = dynamic(() => import("@/components/video/video-player").then((mod) => mod.VideoPlayer), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full aspect-video flex items-center justify-center bg-black/90 rounded-xl border border-white/10">
      <div className="flex flex-col items-center gap-2.5">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-xs text-white/50 tracking-wider">Cargando reproductor...</p>
      </div>
    </div>
  ),
})

const ChatPanel = dynamic(() => import("@/components/ai/chat-panel").then((mod) => mod.ChatPanel), {
  ssr: false,
  loading: () => <div className="h-full w-full shimmer rounded-xl" />,
})

const ExerciseViewer = dynamic(() => import("@/components/exercises/exercise-viewer").then((mod) => mod.ExerciseViewer), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full shimmer rounded-xl" />,
})

const QuizPlayer = dynamic(() => import("@/components/exercises/quiz-player").then((mod) => mod.QuizPlayer), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full shimmer rounded-xl" />,
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
      contentType: ContentType
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
        /** Requiere suscripción: se pinta con candado y no navega. */
        isLocked: boolean
      }>
    }>
    previousLesson: { id: string; title: string } | null
    nextLesson: { id: string; title: string; isLocked: boolean } | null
    completedCount: number
    totalCount: number
    hasFullAccess: boolean
    comments?: ThreadedComment[]
  }
  currentUserId: string
}

type Curriculum = LessonViewerProps["data"]["curriculum"]

/* ── Panel de Curriculum ─────────────────────────────────────────────── */

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
    <div className="space-y-4">
      {/* Progress */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
        <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
          <span className="text-muted-foreground uppercase tracking-wider">Tu Progreso</span>
          <span className="text-primary">{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </div>

      {/* Modules */}
      <div className="space-y-3.5">
        {curriculum.map((mod) => (
          <div key={mod.id} className="space-y-1.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
              Módulo {mod.order}: {mod.title}
            </h4>
            <div className="space-y-1">
              {mod.lessons.map((l, lessonIndex) => (
                <Link
                  key={l.id}
                  // Una lección bloqueada sigue enlazando a su URL: la página
                  // responde con el muro de pago, que nombra la clase. Es más
                  // útil que un enlace muerto, y el servidor sigue siendo
                  // quien decide, así que no se puede colar nadie.
                  href={`/learn/${formationSlug}/${l.id}`}
                  className={cn(
                    "flex items-center gap-2.5 p-2 rounded-lg text-sm font-medium transition-[transform,background-color,border-color,color,box-shadow,opacity]",
                    l.isCurrent
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : l.isLocked
                      ? "text-muted-foreground hover:bg-primary/5"
                      : "hover:bg-primary/5 text-foreground hover:text-primary"
                  )}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-3xs font-semibold shrink-0 transition-colors",
                      l.isCompleted
                        ? "bg-success-soft text-success-strong dark:text-success"
                        : l.isCurrent
                        ? "bg-white/20 text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {l.isCompleted ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      lessonIndex + 1
                    )}
                  </div>
                  <span className={cn(
                    "truncate flex-1 text-xs",
                    l.isCurrent ? "text-primary-foreground font-semibold" : "text-foreground",
                    l.isLocked && !l.isCurrent && "text-muted-foreground"
                  )}>
                    {l.title}
                  </span>
                  {l.isLocked && !l.isCurrent && (
                    <Lock
                      className="h-3 w-3 shrink-0 text-muted-foreground"
                      aria-label="Requiere suscripción"
                    />
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Panel de Comentarios ────────────────────────────────────────────── */

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
    <div className="space-y-4">
      <div className="bg-card/70 border border-border rounded-xl p-3.5 shadow-sm">
        <form onSubmit={onSubmit} className="space-y-2.5">
          <Textarea
            value={commentText}
            onChange={(e) => onCommentTextChange(e.target.value)}
            placeholder="Comparte tu revelación, pregunta o reflexión con los demás..."
            className="w-full resize-none rounded-lg border-border bg-background px-3.5 py-2.5 text-xs sm:text-sm placeholder:text-muted-foreground/60 leading-relaxed"
            rows={3}
            disabled={isPending}
          />
          <div className="flex items-center justify-between border-t border-border/40 pt-2.5">
            <span className="text-2xs text-muted-foreground hidden sm:inline">
              Respeto y calidez en la comunidad
            </span>
            <Button
              type="submit"
              size="sm"
              disabled={isPending || !commentText.trim()}
              className="rounded-lg px-4 h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground ml-auto"
            >
              <Send className="w-3.5 h-3.5 mr-1" />
              {isPending ? "Publicando..." : "Publicar"}
            </Button>
          </div>
        </form>
      </div>

      <div className="pt-1">
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

/* ── Panel de Asistente IA ───────────────────────────────────────────── */

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
    <div className={cn("flex flex-col border border-border rounded-xl p-3.5 bg-card/60 shadow-sm", className)}>
      <ChatPanel lessonId={lessonId} formationId={formationId} className="flex-1" />
    </div>
  )
}

/* ── Panel de Recursos ───────────────────────────────────────────────── */

function ResourcesPanel() {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 text-center space-y-1.5">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto text-primary">
        <Paperclip className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">Recursos y Cuadernos</h3>
      <p className="text-muted-foreground text-xs max-w-sm mx-auto">
        Los materiales descargables, ejercicios guiados y fichas de integración están activos en la pestaña de Práctica.
      </p>
    </div>
  )
}

/* ── Componente Principal LessonViewer ───────────────────────────────── */

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

  useEffect(() => {
    setComments(data.comments || [])
  }, [data.comments])

  const { lesson, module, formation, curriculum, previousLesson, nextLesson, completedCount, totalCount } = data
  const progressPercent = Math.round((completedCount / totalCount) * 100)

  const totalCommentCount = comments.reduce(
    (acc, c) => acc + 1 + (c.replies?.length ?? 0),
    0,
  )

  const handleShareToTaberna = () => {
    sessionStorage.setItem(
      "taberna_draft",
      JSON.stringify({
        content: `✨ Descubrimiento en "${formation.title}" · Lección: ${lesson.title}\n\n`,
        source: lesson.title,
      })
    )
    toast.success("Abriendo La Taberna para compartir tu aprendizaje...")
    router.push("/taberna")
  }

  const handleCommentSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault()
    const trimmed = commentText.trim()
    if (!trimmed) return

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
      markLessonComplete(lesson.id)
      addXP(result.xpEarned ?? 0, result.leveledUp ?? false)

      toast.success(`¡Lección completada! +${result.xpEarned} XP`, {
        description: result.leveledUp ? "¡Subiste de nivel! 🎉" : "Continúa integrando tu aprendizaje.",
      })
      if (result.certificateIssued) {
        setTimeout(() => {
          toast.success("🎓 ¡Certificado emitido!", {
            description: "Has completado toda la formación. Revísalo en tu perfil.",
            duration: 6000,
          })
        }, 1500)
      }
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
      {/* ── Top Header ────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between h-14 px-3 sm:px-6 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link href={`/formations/${formation.slug}`} className="shrink-0">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground px-2 sm:px-2.5 rounded-lg h-8">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline ml-1 text-xs font-semibold">Formación</span>
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-4 bg-border shrink-0 hidden sm:block" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-semibold truncate max-w-[170px] sm:max-w-[260px] md:max-w-[360px] text-foreground">
                {formation.title}
              </p>
              <p className="text-3xs text-muted-foreground hidden sm:block truncate max-w-[260px] md:max-w-[360px]">
                Módulo {module.order}: {module.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden md:flex items-center gap-2">
              <span className="text-2xs font-medium text-muted-foreground">
                {completedCount}/{totalCount}
              </span>
              <Progress value={progressPercent} className="w-24 h-1.5" />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleShareToTaberna}
              className="hidden sm:inline-flex border-primary/30 text-primary hover:bg-primary/10 rounded-lg text-xs h-8 px-2.5"
            >
              <Share2 className="h-3.5 w-3.5 mr-1" />
              Comunidad
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* ── Main Content Area ──────────────────────────────── */}
        <main className="flex-1 min-w-0">
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
            /* Video Player / Theater Screen */
            <div className="bg-black/95 shadow-inner overflow-hidden">
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
                    <div className="w-full h-full flex items-center justify-center text-white/70 p-6">
                      <div className="text-center space-y-2.5">
                        <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center mx-auto text-primary">
                          <Play className="h-8 w-8" />
                        </div>
                        <p className="text-sm font-semibold">Video en preparación</p>
                        <p className="text-xs text-white/50 max-w-sm">Puedes leer las notas, realizar los ejercicios de práctica o consultar con el Asistente IA.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Lesson Body & Didactic Notes ──────────────────── */}
          <div className="max-w-4xl mx-auto px-4 py-5 sm:py-7 pb-24 md:pb-10 space-y-5">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
              <div>
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <Badge variant="outline" className="border-primary/30 text-primary text-3xs font-semibold rounded">
                    Módulo {module.order}
                  </Badge>
                  {lessonCompleted && (
                    <Badge className="bg-success-soft text-success-strong dark:text-success border border-success text-3xs rounded">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Completada
                    </Badge>
                  )}
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-foreground">{lesson.title}</h1>
              </div>

              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-foreground self-start shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>+{lesson.xpReward} XP</span>
              </div>
            </div>

            {/* Quick Action / Completion Card */}
            {canMarkComplete && (
              <Card className="border border-primary/25 bg-primary/5 rounded-xl shadow-sm">
                <CardContent className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground text-xs sm:text-sm">¿Terminaste de ver la lección?</p>
                    <p className="text-2xs text-muted-foreground">
                      Márcala como completada para sumar tus XP y pasar al siguiente paso de tu camino.
                    </p>
                  </div>
                  <Button
                    onClick={handleMarkComplete}
                    disabled={isSaving}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 rounded-lg h-9 text-xs shrink-0 shadow-sm"
                  >
                    {isSaving ? "Guardando..." : "Completar Lección"}
                    <CheckCircle2 className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Didactic Key Takeaways & Description */}
            {lesson.description && (
              <Card className="border border-border bg-card/70 rounded-xl shadow-sm">
                <CardHeader className="pb-2 pt-3.5 px-4 sm:px-5 border-b border-border/40">
                  <CardTitle className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    Puntos Clave y Resumen Didáctico
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-5">
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
                    {lesson.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Interactive Tabs */}
            <Tabs defaultValue="comments" className="w-full">
              <TabsList className="bg-muted/60 w-full justify-start p-1 rounded-lg h-auto flex flex-wrap">
                <TabsTrigger value="comments" className="rounded-md py-2 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                  Comunidad ({totalCommentCount})
                </TabsTrigger>
                <TabsTrigger value="assistant" className="rounded-md py-2 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Bot className="w-3.5 h-3.5 mr-1.5" />
                  Asistente IA
                </TabsTrigger>
                <TabsTrigger value="resources" className="rounded-md py-2 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Paperclip className="w-3.5 h-3.5 mr-1.5" />
                  Recursos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="comments" className="mt-3.5 outline-none">
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

              <TabsContent value="assistant" className="mt-3.5 outline-none">
                <AssistantPanel lessonId={lesson.id} formationId={formation.id} className="h-[440px]" />
              </TabsContent>

              <TabsContent value="resources" className="mt-3.5 outline-none">
                <ResourcesPanel />
              </TabsContent>
            </Tabs>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              {previousLesson ? (
                <Link href={`/learn/${formation.slug}/${previousLesson.id}`}>
                  <Button variant="outline" className="border-border hover:border-primary/40 rounded-lg text-xs h-8">
                    <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                    <span className="hidden sm:inline">{previousLesson.title}</span>
                    <span className="sm:hidden">Anterior</span>
                  </Button>
                </Link>
              ) : (
                <div />
              )}

              {nextLesson ? (
                <Link href={`/learn/${formation.slug}/${nextLesson.id}`}>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg text-xs h-8">
                    {nextLesson.isLocked && (
                      <Lock className="h-3.5 w-3.5 mr-1 shrink-0" aria-hidden />
                    )}
                    <span className="hidden sm:inline">
                      {nextLesson.isLocked ? "Desbloquear siguiente" : nextLesson.title}
                    </span>
                    <span className="sm:hidden">Siguiente</span>
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              ) : (
                <Link href={`/formations/${formation.slug}`}>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg text-xs h-8">
                    Finalizar formación
                    <CheckCircle2 className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </main>

        {/* ── Curriculum Sidebar (Desktop) ───────────────────── */}
        <aside className="hidden lg:block lg:w-80 bg-card/40 border-l border-border">
          <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto p-4 space-y-3.5">
            <h3 className="font-semibold text-foreground text-xs uppercase tracking-wider">Contenido del Curso</h3>
            <CurriculumPanel
              curriculum={curriculum}
              formationSlug={formation.slug}
              progressPercent={progressPercent}
            />
          </div>
        </aside>
      </div>

      {/* ── Mobile Floating Dock ───────────────────────────────
          Mismo lenguaje visual que la barra global de móvil
          (`components/layout/mobile-bottom-nav.tsx`): dock flotante
          redondeado, acristalado y centrado, en lugar de una barra
          pegada de borde a borde. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 md:hidden pointer-events-none px-3 pb-2 pt-1 safe-bottom"
        aria-label="Navegación de la lección"
      >
        <div
          data-translucent=""
          className="pointer-events-auto mx-auto flex w-full max-w-md items-center gap-1 rounded-2xl border border-border/80 bg-card/90 px-1.5 py-1 shadow-[0_8px_32px_rgba(246,210,92,0.12),0_2px_12px_rgba(0,0,0,0.08)] backdrop-blur-2xl"
        >
          <button
            onClick={() => setOpenContenido(true)}
            className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-muted-foreground touch-manipulation hover:text-foreground active:scale-[0.94] transition-[transform,color] duration-100 ease-out"
          >
            <List className="h-4.5 w-4.5" />
            <span className="text-3xs font-medium leading-none">Temario</span>
          </button>

          <button
            onClick={() => setOpenComentarios(true)}
            className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-muted-foreground touch-manipulation hover:text-foreground active:scale-[0.94] transition-[transform,color] duration-100 ease-out"
          >
            <MessageSquare className="h-4.5 w-4.5" />
            <span className="text-3xs font-medium leading-none">Comunidad</span>
            {totalCommentCount > 0 && (
              <span className="absolute top-0 right-1/4 translate-x-1/2 min-w-3.5 h-3.5 px-0.5 rounded-full bg-primary text-primary-foreground text-3xs font-bold flex items-center justify-center">
                {totalCommentCount > 99 ? "99+" : totalCommentCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setOpenIA(true)}
            className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-muted-foreground touch-manipulation hover:text-foreground active:scale-[0.94] transition-[transform,color] duration-100 ease-out"
          >
            <Bot className="h-4.5 w-4.5 text-primary" />
            <span className="text-3xs font-medium leading-none">IA Guía</span>
          </button>

          {/* Acción principal */}
          {canMarkComplete ? (
            <Button
              onClick={handleMarkComplete}
              disabled={isSaving}
              size="sm"
              className="min-w-0 flex-[1.25] bg-primary hover:bg-primary/90 text-primary-foreground h-9 rounded-xl flex items-center justify-center gap-1 px-2"
            >
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate text-2xs font-semibold">{isSaving ? "..." : "Completar"}</span>
            </Button>
          ) : nextLesson ? (
            <Button
              onClick={() => router.push(`/learn/${formation.slug}/${nextLesson.id}`)}
              size="sm"
              className="min-w-0 flex-[1.25] bg-primary hover:bg-primary/90 text-primary-foreground h-9 rounded-xl flex items-center justify-center gap-1 px-2"
            >
              <span className="truncate text-2xs font-semibold">Siguiente</span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            </Button>
          ) : (
            <Button
              onClick={() => router.push(`/formations/${formation.slug}`)}
              size="sm"
              className="min-w-0 flex-[1.25] bg-primary hover:bg-primary/90 text-primary-foreground h-9 rounded-xl flex items-center justify-center gap-1 px-2"
            >
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate text-2xs font-semibold">Finalizar</span>
            </Button>
          )}
        </div>
      </nav>

      {/* ── Mobile Sheets ─────────────────────────────────── */}
      <Sheet open={openContenido} onOpenChange={setOpenContenido}>
        <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl md:hidden"
          contentClassName="px-4 pb-6">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-left text-sm font-semibold">Temario del Curso</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto max-h-[70vh] pb-4" onClick={(e) => {
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
        <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl md:hidden"
          contentClassName="px-4 pb-6">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-left text-sm font-semibold">Comunidad ({totalCommentCount})</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto max-h-[70vh] pb-4">
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
        <SheetContent
          side="bottom"
          className="h-[85vh] rounded-t-2xl md:hidden"
          contentClassName="px-4 pb-6"
        >
          <SheetHeader className="pb-2">
            <SheetTitle className="text-left text-sm font-semibold">Asistente IA Ainara</SheetTitle>
          </SheetHeader>
          <AssistantPanel lessonId={lesson.id} formationId={formation.id} className="flex-1 min-h-0" />
        </SheetContent>
      </Sheet>
    </div>
  )
}
