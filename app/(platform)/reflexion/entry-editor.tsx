"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  Feather,
  Lock,
  PenLine,
  Quote,
  Trash2,
  Sparkles,
  Share2,
  Heart,
  Compass,
  Lightbulb,
  Target,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { DailyReflectionEntry } from "@/lib/data-access"
import { phraseForDate } from "@/lib/daily-phrases"
import { MoodPicker } from "./mood-picker"
import { MOOD_ICONS, MOOD_LABELS } from "./moods"
import { deleteDailyReflection, upsertDailyReflection } from "./actions"
import { useRouter } from "next/navigation"

interface EntryEditorProps {
  date: string
  entry: DailyReflectionEntry | null
  isToday: boolean
  /** El editor se monta dentro de una hoja inferior en móvil. */
  inSheet?: boolean
  onSaved?: () => void
}

const GUIDED_PROMPTS = [
  {
    id: "gratitude",
    label: "Gratitud",
    icon: Heart,
    prompt: "Hoy agradezco profundamente...",
    hint: "¿Por qué pequeño detalle sonreíste hoy?",
  },
  {
    id: "shadow",
    label: "Sombra",
    icon: Compass,
    prompt: "Una emoción o situación que me desafió hoy y su lección es...",
    hint: "¿Qué emoción intenté evadir o postergar?",
  },
  {
    id: "insight",
    label: "Revelación",
    icon: Lightbulb,
    prompt: "Lo que hoy comprendí sobre mí mismo/a es...",
    hint: "¿Qué verdad incómoda pero liberadora vi hoy?",
  },
  {
    id: "intention",
    label: "Intención",
    icon: Target,
    prompt: "Mi intención consciente para integrar en mi vida diaria es...",
    hint: "¿Cómo elijo actuar y estar a partir de mañana?",
  },
]

export function EntryEditor({
  date,
  entry,
  isToday,
  inSheet,
  onSaved,
}: EntryEditorProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = React.useState(!entry && isToday)
  const [mood, setMood] = React.useState<string | null>(entry?.mood ?? null)
  const [content, setContent] = React.useState(entry?.content ?? "")
  const [isPending, startTransition] = React.useTransition()
  const [activePromptId, setActivePromptId] = React.useState<string | null>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const fieldId = React.useId()

  // Rehidratar al cambiar de día
  React.useEffect(() => {
    setMood(entry?.mood ?? null)
    setContent(entry?.content ?? "")
    setIsEditing(!entry && isToday)
    setActivePromptId(null)
  }, [date, entry, isToday])

  // Auto-crecimiento del textarea
  React.useEffect(() => {
    const el = textareaRef.current
    if (!el || !isEditing) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 480)}px`
  }, [content, isEditing])

  const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  const prompt = phraseForDate(new Date(`${date}T12:00:00`))

  const handleApplyPrompt = (promptId: string, promptText: string) => {
    setActivePromptId(promptId)
    if (content && !content.endsWith("\n\n") && !content.endsWith(" ")) {
      setContent((prev) => `${prev}\n\n${promptText} `)
    } else {
      setContent((prev) => `${prev}${promptText} `)
    }
    textareaRef.current?.focus()
  }

  function handleSave() {
    if (!mood) {
      toast.error("Selecciona cómo te sentías hoy para registrar tu clima interior.")
      return
    }
    const formData = new FormData()
    formData.set("mood", mood)
    formData.set("content", content)
    formData.set("entry_date", date)

    startTransition(async () => {
      const result = await upsertDailyReflection(formData)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      setIsEditing(false)
      if (result?.xpAwarded) {
        toast.success(`¡Reflexión guardada! · +${result.xpAwarded} XP`, {
          description: "Has fortalecido tu constancia y racha de autoconocimiento.",
        })
      } else {
        toast.success("Reflexión actualizada correctamente.")
      }
      onSaved?.()
    })
  }

  function handleShareToCommunity() {
    if (!content.trim()) {
      toast.info("Escribe algo en tu reflexión para compartirlo con la comunidad.")
      return
    }
    sessionStorage.setItem(
      "taberna_draft",
      JSON.stringify({
        content: `💭 Reflexión personal (${dateLabel}):\n\n"${content}"`,
        source: `Reflexión Diaria`,
      })
    )
    toast.success("Abriendo La Taberna con tu reflexión lista...")
    router.push("/taberna")
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteDailyReflection(date)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      setMood(null)
      setContent("")
      setIsEditing(isToday)
      toast.success("Entrada eliminada.")
      onSaved?.()
    })
  }

  const wordsCount = content.trim() ? content.trim().split(/\s+/).length : 0
  const readingTimeMin = Math.max(1, Math.ceil(wordsCount / 180))

  if (!entry && !isToday) {
    return (
      <div className="flex flex-col items-center gap-2.5 py-12 text-center text-muted-foreground">
        <div className="h-12 w-12 rounded-2xl bg-muted/40 flex items-center justify-center">
          <Lock className="h-6 w-6 opacity-40 text-primary" />
        </div>
        <p className="text-sm capitalize text-foreground font-semibold">{dateLabel}</p>
        <p className="max-w-xs text-xs text-muted-foreground/80 leading-relaxed">
          No registraste entrada en esta fecha. La reflexión diaria está disponible para el día en curso para nutrir tu constancia.
        </p>
      </div>
    )
  }

  const SavedMoodIcon = entry ? MOOD_ICONS[entry.mood] : null

  if (!isEditing && entry) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-primary/10 border border-primary/25 shadow-xs">
          <div className="flex min-w-0 items-center gap-3">
            {SavedMoodIcon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-xs">
                <SavedMoodIcon className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-xs capitalize text-muted-foreground font-medium">
                {dateLabel}
              </p>
              <p className="text-sm sm:text-base font-bold text-foreground">
                {MOOD_LABELS[entry.mood]}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10 rounded-lg text-xs font-semibold h-8"
            >
              <PenLine className="h-3.5 w-3.5" />
              Editar
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDelete}
              disabled={isPending}
              aria-label="Eliminar entrada"
              className="text-muted-foreground hover:text-destructive rounded-lg h-8 w-8"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {entry.content ? (
          <div className="space-y-3.5">
            <blockquote className="whitespace-pre-wrap rounded-xl border border-border/80 bg-card/75 p-5 text-sm sm:text-base leading-relaxed text-foreground shadow-xs">
              {entry.content}
            </blockquote>

            <div className="flex items-center justify-between flex-wrap gap-2 pt-1 text-3xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{wordsCount} palabras · ~{readingTimeMin} min de lectura</span>
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={handleShareToCommunity}
                className="border-primary/30 text-primary hover:bg-primary/10 rounded-lg text-xs h-8 ml-auto font-medium"
              >
                <Share2 className="h-3.5 w-3.5 mr-1.5" />
                Compartir en La Taberna
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm italic text-muted-foreground text-center py-6">
            Registraste tu clima interior sin texto adicional.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Frase / Oráculo del día */}
      <div className="flex gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-xs">
        <Quote className="h-4 w-4 shrink-0 text-primary mt-0.5" />
        <div className="space-y-0.5">
          <span className="text-3xs uppercase tracking-wider font-bold text-primary">
            Una pregunta para empezar
          </span>
          <p className="font-display text-sm sm:text-base italic leading-relaxed text-foreground/90">
            {prompt}
          </p>
        </div>
      </div>

      {/* Selector de Estado */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs sm:text-sm font-semibold text-foreground">
            {isToday ? "¿Cómo está tu energía hoy?" : "¿Cómo te sentías?"}
          </p>
          <span className="text-2xs text-muted-foreground">Clima interior</span>
        </div>
        <MoodPicker value={mood} onChange={setMood} disabled={isPending} />
      </div>

      {/* Prompts Guiados con descripción inspiradora */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-2xs font-semibold text-muted-foreground uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Preguntas guía de introspección</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {GUIDED_PROMPTS.map((p) => {
            const isChosen = activePromptId === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPrompt(p.id, p.prompt)}
                title={p.hint}
                className={cn(
                  "flex flex-col items-start gap-1 p-2.5 rounded-lg border text-left transition-all duration-150 active:scale-95 shadow-xs",
                  isChosen
                    ? "border-primary bg-primary/15 text-primary shadow-xs"
                    : "border-border/70 bg-card/60 hover:border-primary/40 hover:bg-primary/5 text-foreground"
                )}
              >
                <div className="flex items-center gap-1.5">
                  <p.icon className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold">{p.label}</span>
                </div>
                <span className="text-3xs text-muted-foreground line-clamp-1">
                  {p.hint}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Textarea con bordes limpios (rounded-lg) y padding generoso */}
      <div className="space-y-1.5">
        <label
          htmlFor={fieldId}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-foreground"
        >
          <Feather className="h-4 w-4 text-primary" />
          ¿Qué necesitas expresar hoy?
        </label>
        <textarea
          ref={textareaRef}
          id={fieldId}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={2000}
          rows={8}
          placeholder="Escribe lo que sientes, tus comprensiones o lo que quieres soltar con total libertad..."
          className={cn(
            "w-full resize-none rounded-lg border border-border/80 bg-card px-4 py-3",
            "min-h-[220px] text-base leading-loose text-foreground",
            "placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30",
            "transition-colors shadow-xs"
          )}
        />
        <div className="flex items-center justify-between text-2xs text-muted-foreground pt-0.5">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{wordsCount} palabras</span>
            {wordsCount > 0 && <span>· ~{readingTimeMin} min</span>}
          </span>
          <span>{content.length}/2000</span>
        </div>
      </div>

      {/* Botones de acción */}
      <div
        className={cn(
          "flex items-center justify-end gap-2.5 pt-1",
          inSheet &&
            "sticky bottom-0 -mx-4 border-t border-border bg-card px-4 py-3 backdrop-blur-xl"
        )}
      >
        {entry && (
          <Button
            variant="ghost"
            onClick={() => {
              setIsEditing(false)
              setMood(entry.mood)
              setContent(entry.content)
            }}
            disabled={isPending}
            className="rounded-lg h-9 text-xs"
          >
            Cancelar
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={isPending || !mood}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 rounded-lg h-9 text-xs shadow-xs transition-transform active:scale-95"
        >
          {isPending ? "Guardando…" : entry ? "Actualizar Reflexión" : "Guardar Reflexión · +XP"}
        </Button>
      </div>
    </div>
  )
}
