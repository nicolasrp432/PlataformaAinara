"use client"

import { useState, useEffect, useTransition } from "react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Send, Sparkles } from "lucide-react"
import { createReflection } from "./actions"

type ReflectionAuthor = {
  full_name: string | null
  avatar_url: string | null
  role?: string | null
}

type ReflectionItem = {
  id: string
  content: string
  created_at: string
  likes_count: number
  parent_id: string | null
  profiles: ReflectionAuthor | ReflectionAuthor[] | null
  lessons: { title: string } | null
}

type OptimisticReflectionUpdate = ReflectionItem | { __revert: true }

interface ReflectionFormProps {
  user: {
    full_name: string
    avatarUrl: string | null
  }
  onOptimisticReflection?: (reflection: OptimisticReflectionUpdate) => void
}

const TOPIC_PRESETS = [
  { label: "💡 Revelación", prefix: "#Revelación: " },
  { label: "❓ Pregunta", prefix: "#Pregunta: " },
  { label: "🎯 Práctica", prefix: "#Práctica: " },
  { label: "✨ Gratitud", prefix: "#Gratitud: " },
]

export function ReflectionForm({ user, onOptimisticReflection }: ReflectionFormProps) {
  const [isPending, startTransition] = useTransition()
  const [content, setContent] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Cargar borrador de sessionStorage
  useEffect(() => {
    try {
      const rawDraft = sessionStorage.getItem("taberna_draft")
      if (rawDraft) {
        const parsed = JSON.parse(rawDraft)
        if (parsed?.content) {
          setContent(parsed.content)
          sessionStorage.removeItem("taberna_draft")
          toast.info("Hemos cargado tu reflexión lista para compartir.")
        }
      }
    } catch {
      // safe fallback
    }
  }, [])

  const handleApplyTag = (tagPrefix: string) => {
    if (!content.startsWith(tagPrefix)) {
      setContent((prev) => `${tagPrefix}${prev}`)
    }
  }

  const handleSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) return

    setError(null)

    onOptimisticReflection?.({
      id: `temp-${Date.now()}`,
      content: trimmed,
      created_at: new Date().toISOString(),
      likes_count: 0,
      parent_id: null,
      profiles: { full_name: user.full_name, avatar_url: user.avatarUrl, role: "student" },
      lessons: null,
    })
    setContent("")

    const formData = new FormData()
    formData.append("content", trimmed)

    startTransition(async () => {
      try {
        const result = await createReflection(formData)
        if (result.error) {
          setError(result.error)
          onOptimisticReflection?.({ __revert: true })
        } else {
          toast.success("¡Tu voz ha sido compartida en la comunidad!")
        }
      } catch {
        setError("Ocurrió un error al enviar tu publicación.")
      }
    })
  }

  return (
    <Card className="border border-border/80 bg-card/70 backdrop-blur-md shadow-sm rounded-xl overflow-hidden mb-6">
      <CardContent className="p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Comparte tu Voz
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            {TOPIC_PRESETS.map((tag) => (
              <button
                key={tag.label}
                type="button"
                onClick={() => handleApplyTag(tag.prefix)}
                className="text-[11px] font-semibold px-2 py-1 rounded-md border border-border bg-background/60 hover:bg-primary/10 hover:border-primary/40 text-foreground transition-all active:scale-95 shrink-0"
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <Avatar className="h-9 w-9 shrink-0 ring-1 ring-primary/20 hidden sm:block">
              <AvatarImage src={user.avatarUrl || ""} />
              <AvatarFallback className="bg-primary/15 text-primary font-bold text-xs">
                {user.full_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2.5">
              <Textarea
                placeholder="¿Qué entendiste hoy? ¿Qué duda tienes sobre tu camino? Escribe con libertad..."
                className="min-h-[100px] resize-none bg-background rounded-lg border-border px-3.5 py-2.5 text-sm sm:text-base leading-relaxed placeholder:text-muted-foreground/60"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isPending}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] text-muted-foreground hidden sm:block">
                  Las reflexiones auténticas crean puentes de crecimiento mutuo.
                </p>
                <Button
                  type="submit"
                  disabled={isPending || !content.trim()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg px-5 h-9 text-xs shadow-sm w-full sm:w-auto"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Publicando...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      Publicar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
