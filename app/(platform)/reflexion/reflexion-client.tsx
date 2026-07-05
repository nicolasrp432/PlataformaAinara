"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import {
  Cloud,
  CloudRain,
  Feather,
  Flame,
  Minus,
  PenLine,
  Sparkles,
  Sun,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { DailyReflectionEntry } from "@/lib/data-access"
import { upsertDailyReflection } from "./actions"

const MOODS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "radiante", label: "Radiante", icon: Sun },
  { id: "en_calma", label: "En calma", icon: Sparkles },
  { id: "neutral", label: "Neutral", icon: Minus },
  { id: "nublado", label: "Nublado", icon: Cloud },
  { id: "tormenta", label: "Tormenta", icon: CloudRain },
]

const MOOD_ICONS: Record<string, LucideIcon> = Object.fromEntries(
  MOODS.map((m) => [m.id, m.icon])
)

const MOOD_LABELS: Record<string, string> = Object.fromEntries(
  MOODS.map((m) => [m.id, m.label])
)

interface ReflexionClientProps {
  todayEntry: DailyReflectionEntry | null
  recent: DailyReflectionEntry[]
  streak: number
  today: string
}

export function ReflexionClient({ todayEntry, recent, streak, today }: ReflexionClientProps) {
  const [isEditing, setIsEditing] = React.useState(!todayEntry)
  const [mood, setMood] = React.useState<string | null>(todayEntry?.mood ?? null)
  const [content, setContent] = React.useState(todayEntry?.content ?? "")
  const [isPending, startTransition] = React.useTransition()

  const dateLabel = new Date(`${today}T12:00:00`).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  // Tira de los últimos 14 días (de más antiguo a hoy)
  const strip = React.useMemo(() => {
    const byDate = new Map(recent.map((e) => [e.entry_date, e]))
    const days: { date: string; entry: DailyReflectionEntry | undefined }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(`${today}T12:00:00`)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      days.push({ date: key, entry: byDate.get(key) })
    }
    return days
  }, [recent, today])

  function handleSave() {
    if (!mood) {
      toast.error("Selecciona cómo te sientes hoy.")
      return
    }
    const formData = new FormData()
    formData.set("mood", mood)
    formData.set("content", content)

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
    })
  }

  const SavedMoodIcon = todayEntry ? MOOD_ICONS[todayEntry.mood] : null

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-16 relative">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-2"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <Badge className="bg-primary/15 text-primary hover:bg-primary/20 border border-primary/25 px-3 py-1 text-[10px] tracking-widest uppercase mb-2">
              Diario privado
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground">
              Reflexión{" "}
              <span className="font-semibold text-primary">diaria</span>
            </h1>
            <p className="font-display text-lg text-muted-foreground capitalize mt-1">
              {dateLabel}
            </p>
          </div>
          <div className="flex flex-col items-center gap-1 shrink-0 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
            <Flame className="h-5 w-5 text-primary" />
            <span className="text-xl font-bold text-foreground leading-none">{streak}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {streak === 1 ? "día" : "días"}
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground max-w-lg">
          Un momento al día para volver a ti. Solo tú puedes ver lo que escribes aquí.
        </p>
      </motion.div>

      {/* Tira de 14 días */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="flex items-center justify-between gap-1 rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl px-4 py-3 overflow-x-auto scrollbar-hide"
      >
        {strip.map(({ date, entry }) => {
          const Icon = entry ? MOOD_ICONS[entry.mood] : null
          const dayNum = date.slice(8, 10)
          const isToday = date === today
          return (
            <div
              key={date}
              title={entry ? `${dayNum} · ${MOOD_LABELS[entry.mood]}` : `${dayNum} · Sin entrada`}
              className="flex flex-col items-center gap-1.5 min-w-[2rem]"
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center transition-colors",
                  entry
                    ? "bg-primary/15 text-primary"
                    : "bg-muted/40 text-muted-foreground/30",
                  isToday && "ring-2 ring-primary/40"
                )}
              >
                {Icon ? <Icon className="w-3.5 h-3.5" /> : <Minus className="w-3 h-3" />}
              </div>
              <span
                className={cn(
                  "text-[9px] leading-none",
                  isToday ? "text-primary font-bold" : "text-muted-foreground/60"
                )}
              >
                {dayNum}
              </span>
            </div>
          )
        })}
      </motion.div>

      {/* Card principal */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
      >
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-xl shadow-black/5 overflow-hidden">
          <div className="h-1.5 gold-gradient" />
          <CardContent className="p-6 sm:p-8 space-y-7">
            {isEditing ? (
              <>
                {/* Selector de estado */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">
                    ¿Cómo te sientes hoy?
                  </p>
                  <div className="grid grid-cols-5 gap-2 sm:gap-3">
                    {MOODS.map((m) => {
                      const Icon = m.icon
                      const selected = mood === m.id
                      return (
                        <motion.button
                          key={m.id}
                          type="button"
                          whileTap={{ scale: 0.94 }}
                          onClick={() => setMood(m.id)}
                          className={cn(
                            "flex flex-col items-center gap-2 rounded-xl border px-1 py-3 sm:py-4 transition-all",
                            selected
                              ? "border-primary/50 bg-primary/10 ring-2 ring-primary/30 shadow-sm"
                              : "border-border/50 bg-background/40 hover:border-primary/25 hover:bg-primary/5"
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-5 w-5 sm:h-6 sm:w-6",
                              selected ? "text-primary" : "text-muted-foreground"
                            )}
                          />
                          <span
                            className={cn(
                              "text-[10px] sm:text-xs leading-none",
                              selected
                                ? "text-foreground font-semibold"
                                : "text-muted-foreground"
                            )}
                          >
                            {m.label}
                          </span>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* Nota */}
                <div className="space-y-2">
                  <label
                    htmlFor="reflexion-content"
                    className="text-sm font-medium text-foreground flex items-center gap-2"
                  >
                    <Feather className="h-4 w-4 text-primary" />
                    ¿Qué resonó hoy en ti?
                  </label>
                  <textarea
                    id="reflexion-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    maxLength={2000}
                    rows={5}
                    placeholder="Escribe con libertad: es tu espacio privado…"
                    className="w-full resize-none rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-shadow"
                  />
                  <p className="text-[11px] text-muted-foreground/60 text-right">
                    {content.length}/2000
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3">
                  {todayEntry && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setIsEditing(false)
                        setMood(todayEntry.mood)
                        setContent(todayEntry.content)
                      }}
                      disabled={isPending}
                    >
                      Cancelar
                    </Button>
                  )}
                  <Button
                    onClick={handleSave}
                    disabled={isPending || !mood}
                    className="bg-primary hover:bg-primary/90 px-6"
                  >
                    {isPending ? "Guardando…" : todayEntry ? "Actualizar" : "Guardar reflexión"}
                  </Button>
                </div>
              </>
            ) : (
              todayEntry && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {SavedMoodIcon && (
                        <div className="w-11 h-11 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                          <SavedMoodIcon className="h-5 w-5" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-muted-foreground">Hoy te sientes</p>
                        <p className="font-semibold text-foreground">
                          {MOOD_LABELS[todayEntry.mood]}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="gap-2 border-primary/25 text-primary hover:bg-primary/5"
                    >
                      <PenLine className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                  </div>

                  {todayEntry.content ? (
                    <blockquote className="border-l-2 border-primary/40 pl-4 text-sm sm:text-base leading-relaxed text-foreground/90 whitespace-pre-wrap">
                      {todayEntry.content}
                    </blockquote>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Hoy registraste tu estado sin nota escrita.
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground/70 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-primary" />
                    Reflexión de hoy completada. Vuelve mañana para mantener tu racha.
                  </p>
                </div>
              )
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
