"use client"

import { useState, useEffect, useTransition } from "react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CircleHelp, Heart, Lightbulb, Loader2, Quote, Send, Sparkles, Target } from "lucide-react"
import { createReflection } from "./actions"
import type { ReflectionCategory } from "@/lib/reflection-categories"

type ReflectionAuthor = {
  id?: string
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
  category: ReflectionCategory
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

const CATEGORY_OPTIONS: { id: ReflectionCategory; label: string; icon: typeof Lightbulb }[] = [
  { id: "reflection", label: "Reflexión", icon: Lightbulb },
  { id: "question", label: "Pregunta", icon: CircleHelp },
  { id: "practice", label: "Práctica", icon: Target },
  { id: "gratitude", label: "Gratitud", icon: Heart },
  { id: "testimonial", label: "Testimonio", icon: Quote },
]

const MAX_CHARS = 1500

export function ReflectionForm({ user, onOptimisticReflection }: ReflectionFormProps) {
  const [isPending, startTransition] = useTransition()
  const [content, setContent] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState<ReflectionCategory>("reflection")

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
      category,
      profiles: { full_name: user.full_name, avatar_url: user.avatarUrl, role: "student" },
      lessons: null,
    })
    setContent("")

    const formData = new FormData()
    formData.append("content", trimmed)
    formData.append("category", category)

    startTransition(async () => {
      try {
        const result = await createReflection(formData)
        if (result.error) {
          setError(result.error)
          onOptimisticReflection?.({ __revert: true })
          toast.error(result.error)
        } else {
          toast.success("¡Tu reflexión ha sido compartida con la comunidad!")
        }
      } catch {
        setError("Ocurrió un error al publicar tu mensaje.")
        onOptimisticReflection?.({ __revert: true })
      }
    })
  }

  const charsLeft = MAX_CHARS - content.length

  return (
    <Card className="border border-border/80 bg-card/75 backdrop-blur-md shadow-sm rounded-xl overflow-hidden mb-6">
      <CardContent className="p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              Comparte tu Voz
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            {CATEGORY_OPTIONS.map((item) => {
              const isSelected = category === item.id
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategory(item.id)}
                  aria-pressed={isSelected}
                  className={`text-2xs font-semibold px-2.5 py-1 rounded-md border transition-all duration-150 active:scale-95 shrink-0 ${
                    isSelected
                      ? "border-primary bg-primary/20 text-primary font-bold shadow-xs"
                      : "border-border/70 bg-background/60 hover:bg-primary/10 hover:border-primary/30 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="mr-1 inline h-3 w-3" aria-hidden="true" />
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-3">
            <Avatar className="h-9 w-9 shrink-0 ring-1 ring-primary/20 hidden sm:block mt-0.5">
              <AvatarImage src={user.avatarUrl || ""} />
              <AvatarFallback className="bg-primary/15 text-primary font-bold text-xs">
                {user.full_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2.5">
              <Textarea
                aria-label="Tu publicación en la comunidad"
                maxLength={MAX_CHARS}
                placeholder="¿Qué comprendiste hoy? ¿Qué inquietud deseas debatir con la comunidad? Escribe con honestidad..."
                className="min-h-[96px] resize-none bg-background/80 rounded-lg border-border/80 px-3.5 py-2.5 text-sm leading-relaxed placeholder:text-muted-foreground/60 focus-visible:ring-primary/20"
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
                disabled={isPending}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <span className={`text-3xs font-medium ${charsLeft < 100 ? "text-warning" : "text-muted-foreground"}`}>
                  {charsLeft} caracteres restantes
                </span>

                <Button
                  type="submit"
                  disabled={isPending || !content.trim()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg px-5 h-9 text-xs shadow-xs w-full sm:w-auto"
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
