"use client"

import { useState, useEffect, useTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import { createReflection } from "./actions"
import { ReflectionForm } from "./reflection-form"
import { ResonanceButton } from "./resonance-button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { MessageCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type ReflectionAuthor = {
  full_name: string | null
  avatar_url: string | null
  role?: string | null
}

type ReflectionReply = {
  id: string
  content: string
  created_at: string
  likes_count: number
  parent_id: string | null
  profiles: ReflectionAuthor | ReflectionAuthor[] | null
  lessons: null
}

type ReflectionItem = {
  id: string
  content: string
  created_at: string
  likes_count: number
  parent_id: string | null
  profiles: ReflectionAuthor | ReflectionAuthor[] | null
  lessons: { title: string } | null
  replies?: ReflectionReply[]
}

type OptimisticReflectionUpdate = ReflectionItem | { __revert: true }

type ReflectionInsertPayload = {
  id: string
  user_id: string
  content: string
  created_at: string
  likes_count: number | null
  parent_id: string | null
}

function formatTimeAgo(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diffInSeconds < 60) return "Hace un momento"
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `Hace ${diffInMinutes}m`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `Hace ${diffInHours}h`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) return `Hace ${diffInDays}d`
  return date.toLocaleDateString("es-ES", { month: "short", day: "numeric" })
}

interface TabernaFeedProps {
  initialReflections: ReflectionItem[]
  currentUser: { full_name: string; avatarUrl: string | null }
}

const FEED_FILTERS = [
  { id: "all", label: "🌟 Todas" },
  { id: "revelacion", label: "💡 Revelaciones", match: "#revelación" },
  { id: "pregunta", label: "❓ Preguntas", match: "#pregunta" },
  { id: "practica", label: "🎯 Práctica", match: "#práctica" },
]

export function TabernaFeed({ initialReflections, currentUser }: TabernaFeedProps) {
  const [reflections, setReflections] = useState<ReflectionItem[]>(
    initialReflections.map((r) => ({ ...r, replies: r.replies || [] }))
  )
  const [activeFilter, setActiveFilter] = useState("all")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [isPendingReply, startReplyTransition] = useTransition()

  const handleOptimisticReflection = (reflection: OptimisticReflectionUpdate) => {
    if ("__revert" in reflection) {
      setReflections((prev) => prev.filter((r) => !r.id?.startsWith("temp-")))
      return
    }
    setReflections((prev) => [{ ...reflection, replies: [] }, ...prev])
  }

  const handleReply = (reflectionId: string, authorName: string) => {
    setReplyingTo(reflectionId)
    setReplyText(`@${authorName} `)
  }

  const handleCancelReply = () => {
    setReplyingTo(null)
    setReplyText("")
  }

  const handleSubmitReply = (e: React.FormEvent, reflectionId: string) => {
    e.preventDefault()
    const trimmed = replyText.trim()
    if (!trimmed) return

    const optimisticReply = {
      id: `temp-${Date.now()}`,
      content: trimmed,
      created_at: new Date().toISOString(),
      likes_count: 0,
      parent_id: reflectionId,
      profiles: { full_name: currentUser.full_name, avatar_url: currentUser.avatarUrl, role: "student" },
      lessons: null,
    }

    setReflections((prev) =>
      prev.map((r) =>
        r.id === reflectionId
          ? { ...r, replies: [...(r.replies || []), optimisticReply] }
          : r
      )
    )
    setReplyingTo(null)
    setReplyText("")

    const formData = new FormData()
    formData.append("content", trimmed)
    formData.append("parent_id", reflectionId)

    startReplyTransition(async () => {
      const result = await createReflection(formData)
      if (result.error) {
        toast.error(result.error)
        setReflections((prev) =>
          prev.map((r) =>
            r.id === reflectionId
              ? { ...r, replies: (r.replies || []).filter((rep) => rep.id !== optimisticReply.id) }
              : r
          )
        )
      } else {
        toast.success("Respuesta publicada.")
      }
    })
  }

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel("taberna-reflections")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "reflections",
          filter: "is_public=eq.true",
        },
        async (payload) => {
          const raw = payload.new as ReflectionInsertPayload

          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url, role")
            .eq("id", raw.user_id)
            .single()

          const enriched = {
            id: raw.id,
            content: raw.content,
            created_at: raw.created_at,
            likes_count: raw.likes_count ?? 0,
            parent_id: raw.parent_id ?? null,
            profiles: profile ?? null,
            lessons: null,
          }

          setReflections((prev) => {
            if (enriched.parent_id) {
              return prev.map((r) => {
                if (r.id !== enriched.parent_id) return r
                const existing = r.replies || []
                if (existing.some((rep) => rep.id === enriched.id)) return r
                const tempIdx = existing.findIndex(
                  (rep) => rep.id?.startsWith("temp-") && rep.content === enriched.content
                )
                if (tempIdx !== -1) {
                  const next = [...existing]
                  next[tempIdx] = enriched
                  return { ...r, replies: next }
                }
                return { ...r, replies: [...existing, enriched] }
              })
            }

            if (prev.some((r) => r.id === enriched.id)) return prev
            const tempIdx = prev.findIndex(
              (r) => r.id?.startsWith("temp-") && r.content === enriched.content
            )
            if (tempIdx !== -1) {
              const next = [...prev]
              next[tempIdx] = { ...enriched, replies: [] }
              return next
            }
            return [{ ...enriched, replies: [] }, ...prev]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Filtrado de reflexiones
  const filteredReflections = reflections.filter((r) => {
    if (activeFilter === "all") return true
    const targetFilter = FEED_FILTERS.find((f) => f.id === activeFilter)
    if (!targetFilter?.match) return true
    return r.content.toLowerCase().includes(targetFilter.match)
  })

  return (
    <>
      <ReflectionForm user={currentUser} onOptimisticReflection={handleOptimisticReflection} />

      <div className="space-y-4">
        {/* Cabecera y Filtros */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border/70 pb-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Voces de la Comunidad
            </h2>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            {FEED_FILTERS.map((filter) => {
              const isSelected = activeFilter === filter.id
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={cn(
                    "text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all active:scale-95 shrink-0",
                    isSelected
                      ? "border-primary bg-primary/15 text-primary shadow-sm"
                      : "border-border bg-card/40 text-muted-foreground hover:bg-card/80 hover:text-foreground"
                  )}
                >
                  {filter.label}
                </button>
              )
            })}
          </div>
        </div>

        {filteredReflections.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-border rounded-xl bg-card/20 backdrop-blur-sm">
            <MessageCircle className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2.5" />
            <h3 className="text-base font-semibold text-foreground">Aún no hay publicaciones en este tema</h3>
            <p className="text-muted-foreground text-xs max-w-sm mx-auto mt-1">
              Sé el primero en compartir tu experiencia o aprendizaje con los demás.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {filteredReflections.map((reflection) => {
              const authorProfile = Array.isArray(reflection.profiles)
                ? reflection.profiles[0]
                : reflection.profiles
              const authorName = authorProfile?.full_name || "Usuario de la Tribu"
              const authorAvatar = authorProfile?.avatar_url || ""
              const isAuthorAdmin = authorProfile?.role === "admin"
              const isAuthorMentor = authorProfile?.role === "mentor"
              const isTemp = reflection.id?.startsWith("temp-")
              const isReplying = replyingTo === reflection.id
              const replies: ReflectionReply[] = reflection.replies || []

              return (
                <Card
                  key={reflection.id}
                  className={`border-border bg-card/70 backdrop-blur-md rounded-xl shadow-sm overflow-hidden transition-all ${
                    isTemp ? "opacity-70 animate-pulse" : "hover:border-primary/40"
                  }`}
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex gap-3">
                      <Avatar className="h-9 w-9 shrink-0 ring-1 ring-primary/20 mt-0.5">
                        <AvatarImage src={authorAvatar} className="object-cover" />
                        <AvatarFallback className="bg-primary/15 text-primary font-bold text-xs">
                          {authorName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1 text-sm">
                          <div className="flex items-center gap-2 truncate pr-2">
                            <span className="font-semibold text-foreground truncate text-xs sm:text-sm">
                              {authorName}
                            </span>
                            {isAuthorAdmin && (
                              <Badge
                                variant="secondary"
                                className="bg-primary/20 text-primary border-none cursor-default py-0 px-1.5 h-4 text-[9px] uppercase font-bold tracking-wider rounded"
                              >
                                Guía
                              </Badge>
                            )}
                            {isAuthorMentor && !isAuthorAdmin && (
                              <Badge
                                variant="secondary"
                                className="bg-emerald-500/15 text-emerald-600 border-none cursor-default py-0 px-1.5 h-4 text-[9px] uppercase font-bold tracking-wider rounded"
                              >
                                Mentor
                              </Badge>
                            )}
                            <span className="text-muted-foreground text-[11px] hidden sm:inline">
                              &bull; {formatTimeAgo(reflection.created_at)}
                            </span>
                          </div>
                          <span className="text-muted-foreground text-[10px] sm:hidden">
                            {formatTimeAgo(reflection.created_at)}
                          </span>
                        </div>

                        {reflection.lessons && (
                          <div className="mb-2">
                            <Badge
                              variant="secondary"
                              className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-medium rounded-md"
                            >
                              Lección: {reflection.lessons.title}
                            </Badge>
                          </div>
                        )}

                        <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
                          {reflection.content}
                        </p>

                        {!isTemp && (
                          <div className="flex items-center gap-5 mt-3 pt-2.5 border-t border-border/40">
                            <ResonanceButton
                              reflectionId={reflection.id}
                              initialCount={reflection.likes_count || 0}
                            />
                            <button
                              onClick={() =>
                                isReplying
                                  ? handleCancelReply()
                                  : handleReply(reflection.id, authorName)
                              }
                              className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                                isReplying
                                  ? "text-primary"
                                  : "text-muted-foreground hover:text-primary"
                              }`}
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>
                                {isReplying
                                  ? "Cancelar"
                                  : replies.length > 0
                                  ? `Respuestas (${replies.length})`
                                  : "Responder"}
                              </span>
                            </button>
                          </div>
                        )}

                        {/* Hilos de Respuestas */}
                        {replies.length > 0 && (
                          <div className="mt-3 space-y-2.5 pl-3 border-l-2 border-primary/20">
                            {replies.map((reply) => {
                              const rp = Array.isArray(reply.profiles) ? reply.profiles[0] : reply.profiles
                              const rName = rp?.full_name || "Usuario Anónimo"
                              const rAvatar = rp?.avatar_url || ""
                              const rTemp = reply.id?.startsWith("temp-")

                              return (
                                <div
                                  key={reply.id}
                                  className={`flex gap-2 p-2 rounded-lg bg-background/50 ${rTemp ? "opacity-60 animate-pulse" : ""}`}
                                >
                                  <Avatar className="h-6 w-6 shrink-0 ring-1 ring-primary/20 mt-0.5">
                                    <AvatarImage src={rAvatar} className="object-cover" />
                                    <AvatarFallback className="bg-primary/15 text-primary text-[9px] font-bold">
                                      {rName.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 text-xs mb-0.5">
                                      <span className="font-semibold text-foreground text-xs">{rName}</span>
                                      <span className="text-muted-foreground text-[10px]">
                                        &bull; {formatTimeAgo(reply.created_at)}
                                      </span>
                                    </div>
                                    <p className="text-foreground/85 text-xs whitespace-pre-wrap leading-relaxed">
                                      {reply.content}
                                    </p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Formulario de Respuesta */}
                        {isReplying && (
                          <form
                            onSubmit={(e) => handleSubmitReply(e, reflection.id)}
                            className="mt-3 space-y-2"
                          >
                            <Textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder={`Escribe tu respuesta a @${authorName}...`}
                              className="min-h-[70px] resize-none bg-background rounded-lg border-border px-3 py-2 text-xs sm:text-sm"
                              disabled={isPendingReply}
                              autoFocus
                            />
                            <div className="flex justify-end gap-1.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelReply}
                                disabled={isPendingReply}
                                className="text-muted-foreground text-xs rounded-lg h-8 px-3"
                              >
                                Cancelar
                              </Button>
                              <Button
                                type="submit"
                                size="sm"
                                disabled={isPendingReply || !replyText.trim()}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg px-4 h-8"
                              >
                                {isPendingReply ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                    Enviando...
                                  </>
                                ) : (
                                  "Enviar"
                                )}
                              </Button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
