"use client"

import * as React from "react"
import { toast } from "sonner"
import { Feather, Lock, PenLine, Quote, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { DailyReflectionEntry } from "@/lib/data-access"
import { phraseForDate } from "@/lib/daily-phrases"
import { MoodPicker } from "./mood-picker"
import { MOOD_ICONS, MOOD_LABELS } from "./moods"
import { deleteDailyReflection, upsertDailyReflection } from "./actions"

interface EntryEditorProps {
  date: string
  entry: DailyReflectionEntry | null
  isToday: boolean
  /** El editor se monta dentro de una hoja inferior en móvil. */
  inSheet?: boolean
  onSaved?: () => void
}

export function EntryEditor({
  date,
  entry,
  isToday,
  inSheet,
  onSaved,
}: EntryEditorProps) {
  const [isEditing, setIsEditing] = React.useState(!entry && isToday)
  const [mood, setMood] = React.useState<string | null>(entry?.mood ?? null)
  const [content, setContent] = React.useState(entry?.content ?? "")
  const [isPending, startTransition] = React.useTransition()
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  // Único por instancia: el mismo día puede estar montado en la tarjeta y en
  // la hoja móvil a la vez, y dos ids iguales romperían el <label for>.
  const fieldId = React.useId()

  // Al cambiar de día hay que rehidratar el formulario.
  React.useEffect(() => {
    setMood(entry?.mood ?? null)
    setContent(entry?.content ?? "")
    setIsEditing(!entry && isToday)
  }, [date, entry, isToday])

  // Auto-crecimiento del textarea: en móvil un alto fijo de 5 filas obliga a
  // hacer scroll dentro del propio campo mientras escribes.
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

  function handleSave() {
    if (!mood) {
      toast.error("Selecciona cómo te sentías.")
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
        toast.success(`Reflexión guardada · +${result.xpAwarded} XP`)
      } else {
        toast.success("Reflexión actualizada")
      }
      onSaved?.()
    })
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

  // Día pasado sin entrada: no se puede rellenar hacia atrás.
  if (!entry && !isToday) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
        <Lock className="h-7 w-7 opacity-30" />
        <p className="text-sm capitalize text-foreground">{dateLabel}</p>
        <p className="max-w-xs text-xs">
          No escribiste nada ese día. Solo puedes crear la reflexión de hoy — así
          tu racha sigue siendo honesta.
        </p>
      </div>
    )
  }

  const SavedMoodIcon = entry ? MOOD_ICONS[entry.mood] : null

  if (!isEditing && entry) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {SavedMoodIcon && (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <SavedMoodIcon className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-xs capitalize text-muted-foreground">
                {dateLabel}
              </p>
              <p className="font-semibold text-foreground">
                {MOOD_LABELS[entry.mood]}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="gap-2 border-primary/25 text-primary hover:bg-primary/5"
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
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {entry.content ? (
          <blockquote className="whitespace-pre-wrap border-l-2 border-primary/40 pl-4 text-sm leading-relaxed text-foreground/90 sm:text-base">
            {entry.content}
          </blockquote>
        ) : (
          <p className="text-sm italic text-muted-foreground">
            Registraste tu estado sin nota escrita.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Frase del día: el mismo texto determinista que envía el cron */}
      <div className="flex gap-3 rounded-xl border border-primary/15 bg-primary/5 p-3">
        <Quote className="h-4 w-4 shrink-0 text-primary" />
        <p className="font-display text-sm italic leading-relaxed text-foreground/85">
          {prompt}
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">
          {isToday ? "¿Cómo te sientes hoy?" : "¿Cómo te sentías?"}
        </p>
        <MoodPicker value={mood} onChange={setMood} disabled={isPending} />
      </div>

      <div className="space-y-2">
        <label
          htmlFor={fieldId}
          className="flex items-center gap-2 text-sm font-medium text-foreground"
        >
          <Feather className="h-4 w-4 text-primary" />
          ¿Qué resonó en ti?
        </label>
        <textarea
          ref={textareaRef}
          id={fieldId}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={2000}
          rows={5}
          placeholder="Escribe con libertad: es tu espacio privado…"
          // text-base en móvil evita el auto-zoom de iOS al enfocar.
          className={cn(
            "w-full resize-none rounded-xl border border-border/60 bg-background/60 px-4 py-3",
            "min-h-32 text-base leading-relaxed text-foreground md:text-sm",
            "placeholder:text-muted-foreground/50 transition-shadow",
            "focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
          )}
        />
        <p className="text-right text-[11px] text-muted-foreground/60">
          {content.length}/2000
        </p>
      </div>

      <div
        className={cn(
          "flex items-center justify-end gap-3",
          // Barra pegada al fondo en la hoja móvil: con el teclado abierto el
          // botón de guardar quedaba al final del scroll.
          inSheet &&
            "sticky bottom-0 -mx-4 border-t border-border/60 bg-card/95 px-4 py-3 backdrop-blur-xl"
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
          >
            Cancelar
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={isPending || !mood}
          className="bg-primary px-6 hover:bg-primary/90"
        >
          {isPending ? "Guardando…" : entry ? "Actualizar" : "Guardar reflexión"}
        </Button>
      </div>
    </div>
  )
}
