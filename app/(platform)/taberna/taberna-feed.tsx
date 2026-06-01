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

export function TabernaFeed({ initialReflections, currentUser }: TabernaFeedProps) {
  const [reflections, setReflections] = useState<ReflectionItem[]>(
    initialReflections.map((r) => ({ ...r, replies: r.replies || [] }))
  )
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

  return (
    <>
      <ReflectionForm user={currentUser} onOptimisticReflection={handleOptimisticReflection} />

      <div className="space-y-6">
        <h2 className="text-xl font-medium tracking-tight border-b border-border/50 pb-2">
          Últimas Voces
        </h2>

        {reflections.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-border/50 rounded-xl bg-card/20 backdrop-blur-sm">
            <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <h3 className="text-lg font-medium text-foreground">El silencio reina...</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">
              Sé el primero en romper el hielo compartiendo tu visión del mundo.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {reflections.map((reflection) => {
              const authorProfile = Array.isArray(reflection.profiles)
                ? reflection.profiles[0]
                : reflection.profiles
              const authorName = authorProfile?.full_name || "Usuario Anónimo"
              const authorAvatar = authorProfile?.avatar_url || ""
              const isAuthorAdmin = authorProfile?.role === "admin"
              const isTemp = reflection.id?.startsWith("temp-")
              const isReplying = replyingTo === reflection.id
              const replies: ReflectionReply[] = reflection.replies || []

              return (
                <Card
                  key={reflection.id}
                  className={`border-border/60 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden group transition-all duration-300 ${
                    isTemp ? "opacity-70 animate-pulse" : "hover:bg-card/60"
                  }`}
                >
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex gap-4">
                      <Avatar className="h-10 w-10 shrink-0 border border-border/50 mt-1">
                        <AvatarImage src={authorAvatar} className="object-cover" />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {authorName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1 text-sm">
                          <div className="flex items-center gap-2 truncate pr-2">
                            <span className="font-semibold text-foreground truncate">{authorName}</span>
                            {isAuthorAdmin && (
                              <Badge
                                variant="secondary"
                                className="bg-primary/15 text-primary border-none cursor-default py-0 px-2 h-5 text-[10px] uppercase font-bold tracking-wider"
                              >
                                Fundador
                              </Badge>
                            )}
                            <span className="text-muted-foreground text-xs hidden sm:inline">
                              &bull; {formatTimeAgo(reflection.created_at)}
                            </span>
                          </div>
                          <span className="text-muted-foreground text-xs sm:hidden">
                            {formatTimeAgo(reflection.created_at)}
                          </span>
                        </div>

                        {reflection.lessons && (
                          <div className="mb-3">
                            <Badge
                              variant="secondary"
                              className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
                            >
                              Comentado en: {reflection.lessons.title}
                            </Badge>
                          </div>
                        )}

                        <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                          {reflection.content}
                        </p>

                        {!isTemp && (
                          <div className="flex items-center gap-6 mt-4 pt-3 border-t border-border/30">
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
                              className={`flex items-center gap-2 text-xs font-medium transition-colors ${
                                isReplying
                                  ? "text-primary"
                                  : "text-muted-foreground hover:text-primary"
                              }`}
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span>
                                {isReplying
                                  ? "Cancelar"
                                  : replies.length > 0
                                  ? `Debatir · ${replies.length}`
                                  : "Debatir"}
                              </span>
                            </button>
                          </div>
                        )}

                        {/* Thread replies */}
                        {replies.length > 0 && (
                          <div className="mt-5 space-y-4 pl-4 border-l-2 border-border/40">
                            {replies.map((reply) => {
                              const rp = Array.isArray(reply.profiles) ? reply.profiles[0] : reply.profiles
                              const rName = rp?.full_name || "Usuario Anónimo"
                              const rAvatar = rp?.avatar_url || ""
                              const rTemp = reply.id?.startsWith("temp-")

                              return (
                                <div
                                  key={reply.id}
                                  className={`flex gap-3 ${rTemp ? "opacity-60 animate-pulse" : ""}`}
                                >
                                  <Avatar className="h-7 w-7 shrink-0 border border-border/40 mt-0.5">
                                    <AvatarImage src={rAvatar} className="object-cover" />
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                                      {rName.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 text-xs mb-1">
                                      <span className="font-semibold text-foreground">{rName}</span>
                                      <span className="text-muted-foreground">
                                        &bull; {formatTimeAgo(reply.created_at)}
                                      </span>
                                    </div>
                                    <p className="text-foreground/85 text-sm whitespace-pre-wrap leading-relaxed">
                                      {reply.content}
                                    </p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Reply form */}
                        {isReplying && (
                          <form
                            onSubmit={(e) => handleSubmitReply(e, reflection.id)}
                            className="mt-4 space-y-2"
                          >
                            <Textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder={`Respondiendo a @${authorName}...`}
                              className="min-h-[80px] resize-none bg-background/50 focus-visible:ring-primary/50"
                              disabled={isPendingReply}
                              autoFocus
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelReply}
                                disabled={isPendingReply}
                                className="text-muted-foreground"
                              >
                                Cancelar
                              </Button>
                              <Button
                                type="submit"
                                size="sm"
                                disabled={isPendingReply || !replyText.trim()}
                                className="bg-primary hover:bg-primary/90 rounded-full px-5"
                              >
                                {isPendingReply ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                    Enviando...
                                  </>
                                ) : (
                                  "Responder"
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
