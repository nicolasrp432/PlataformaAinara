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
  },
  {
    id: "shadow",
    label: "Sombra",
    icon: Compass,
    prompt: "Una emoción o situación que me desafió hoy y su lección es...",
  },
  {
    id: "insight",
    label: "Revelación",
    icon: Lightbulb,
    prompt: "Lo que hoy comprendí sobre mí mismo/a es...",
  },
  {
    id: "intention",
    label: "Intención",
    icon: Target,
    prompt: "Mi intención consciente para integrar en mi vida diaria es...",
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
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const fieldId = React.useId()

  // Rehidratar al cambiar de día
  React.useEffect(() => {
    setMood(entry?.mood ?? null)
    setContent(entry?.content ?? "")
    setIsEditing(!entry && isToday)
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

  const handleApplyPrompt = (promptText: string) => {
    if (content && !content.endsWith("\n\n") && !content.endsWith(" ")) {
      setContent((prev) => `${prev}\n\n${promptText} `)
    } else {
      setContent((prev) => `${prev}${promptText} `)
    }
    textareaRef.current?.focus()
  }

  function handleSave() {
    if (!mood) {
      toast.error("Selecciona cómo te sentías hoy.")
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
        toast.success(`Reflexión guardada · +${result.xpAwarded} XP`, {
          description: "¡Has fortalecido tu racha de autoconocimiento!",
        })
      } else {
        toast.success("Reflexión actualizada")
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
        content: `💭 Reflexión del día (${dateLabel}):\n\n"${content}"`,
        source: `Reflexión Diaria`,
      })
    )
    toast.success("Abriendo La Taberna con tu reflexión...")
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
      toast.success("Entrada eliminada")
      onSaved?.()
    })
  }

  if (!entry && !isToday) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
        <Lock className="h-7 w-7 opacity-30" />
        <p className="text-sm capitalize text-foreground font-medium">{dateLabel}</p>
        <p className="max-w-xs text-xs">
          No escribiste nada ese día. Solo puedes crear la reflexión de hoy para mantener tu racha viva.
        </p>
      </div>
    )
  }

  const SavedMoodIcon = entry ? MOOD_ICONS[entry.mood] : null

  if (!isEditing && entry) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-primary/10 border border-primary/20">
          <div className="flex min-w-0 items-center gap-3">
            {SavedMoodIcon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary shadow-sm">
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
          <div className="flex shrink-0 items-center gap-1.5">
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
          <div className="space-y-3">
            <blockquote className="whitespace-pre-wrap rounded-lg border border-border bg-card/60 p-4 text-sm sm:text-base leading-relaxed text-foreground shadow-sm">
              {entry.content}
            </blockquote>

            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareToCommunity}
                className="border-primary/30 text-primary hover:bg-primary/10 rounded-lg text-xs h-8"
              >
                <Share2 className="h-3.5 w-3.5 mr-1.5" />
                Compartir en La Taberna
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm italic text-muted-foreground text-center py-4">
            Registraste tu estado de ánimo sin nota escrita.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Frase / Oráculo del día */}
      <div className="flex gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3.5 shadow-sm">
        <Quote className="h-4 w-4 shrink-0 text-primary mt-0.5" />
        <div className="space-y-0.5">
          <span className="text-3xs uppercase tracking-wider font-bold text-primary">
            Oráculo del Día
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

      {/* Prompts Guiados tipo Toolbar Iconos */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-2xs font-semibold text-muted-foreground uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Guías rápidas</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {GUIDED_PROMPTS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleApplyPrompt(p.prompt)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card/60 hover:border-primary/40 hover:bg-primary/10 text-xs font-medium text-foreground transition-[transform,background-color,border-color,color,box-shadow,opacity] active:scale-95 shadow-sm"
            >
              <p.icon className="h-3.5 w-3.5 text-primary" />
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Textarea con bordes limpios (rounded-lg) y padding generoso */}
      <div className="space-y-1.5">
        <label
          htmlFor={fieldId}
          className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-foreground"
        >
          <Feather className="h-4 w-4 text-primary" />
          Tu Espacio de Desahogo & Verdad
        </label>
        <textarea
          ref={textareaRef}
          id={fieldId}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={2000}
          rows={5}
          placeholder="Escribe lo que sientes, tus conclusiones o lo que quieres soltar…"
          className={cn(
            "w-full resize-none rounded-lg border border-border bg-card px-4 py-3",
            "min-h-[120px] text-base leading-relaxed text-foreground md:text-sm",
            "placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40",
            "transition-colors shadow-sm"
          )}
        />
        <div className="flex items-center justify-between text-2xs text-muted-foreground">
          <span>{content.length > 0 ? `${content.split(/\s+/).filter(Boolean).length} palabras` : "Espacio privado"}</span>
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
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 rounded-lg h-9 text-xs shadow-sm"
        >
          {isPending ? "Guardando…" : entry ? "Actualizar" : "Guardar Reflexión · +XP"}
        </Button>
      </div>
    </div>
  )
}
