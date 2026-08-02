"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Flame, NotebookPen } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import type { DailyReflectionEntry } from "@/lib/data-access"
import { ReflectionCalendar } from "./reflection-calendar"
import { EntryEditor } from "./entry-editor"
import { MOOD_ICONS, MOOD_LABELS, MOOD_TONES } from "./moods"

interface ReflexionClientProps {
  todayEntry: DailyReflectionEntry | null
  recent: DailyReflectionEntry[]
  streak: number
  today: string
}

function shortDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  })
}

export function ReflexionClient({
  todayEntry,
  recent,
  streak,
  today,
}: ReflexionClientProps) {
  const [selected, setSelected] = React.useState(today)
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  const entryFor = React.useCallback(
    (date: string) => recent.find((e) => e.entry_date === date) ?? null,
    [recent]
  )

  const selectedEntry = selected === today ? todayEntry : entryFor(selected)

  const dateLabel = new Date(`${today}T12:00:00`).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  const handleSelect = (date: string) => {
    setSelected(date)
    if (isMobile) setSheetOpen(true)
  }

  // En escritorio la tarjeta muestra el día seleccionado; en móvil se queda
  // siempre en hoy y los días pasados se abren en una hoja inferior.
  const inlineDate = isMobile ? today : selected
  const inlineEntry = isMobile ? todayEntry : selectedEntry

  return (
    <div className="relative mx-auto max-w-3xl space-y-6">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute left-1/3 top-0 -z-10 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-3"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Badge className="mb-2 border border-primary/25 bg-primary/15 px-3 py-1 text-[10px] uppercase tracking-widest text-primary hover:bg-primary/20">
              Diario privado
            </Badge>
            <h1 className="text-2xl font-light tracking-tight text-foreground sm:text-4xl">
              Reflexión <span className="font-semibold text-primary">diaria</span>
            </h1>
            <p className="mt-1 font-display text-base capitalize text-muted-foreground sm:text-lg">
              {dateLabel}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-start rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2 sm:flex-col sm:gap-1 sm:py-3">
            <Flame className="h-5 w-5 text-primary" />
            <span className="text-xl font-bold leading-none text-foreground">
              {streak}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {streak === 1 ? "día" : "días"} de racha
            </span>
          </div>
        </div>

        <p className="max-w-lg text-sm text-muted-foreground">
          Un momento al día para volver a ti. Solo tú puedes ver lo que escribes aquí.
        </p>
      </motion.div>

      {/* Calendario */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.12, duration: 0.4 }}
      >
        <ReflectionCalendar
          entries={recent}
          today={today}
          selected={selected}
          onSelect={handleSelect}
        />
      </motion.div>

      {/* Editor principal */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.45 }}
      >
        <Card className="overflow-hidden border-border/50 bg-card/60 shadow-lg shadow-black/5 backdrop-blur-xl md:shadow-xl">
          <div className="h-1.5 gold-gradient" />
          <CardContent className="p-4 sm:p-8">
            <EntryEditor
              key={`inline-${inlineDate}`}
              date={inlineDate}
              entry={inlineEntry}
              isToday={inlineDate === today}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Historial */}
      {recent.length > 0 && (
        <div className="space-y-2">
          <h2 className="label-luxury flex items-center gap-2">
            <NotebookPen className="h-3.5 w-3.5" />
            Tus últimas entradas
          </h2>
          <div className="space-y-1.5">
            {recent.slice(0, 10).map((e) => {
              const Icon = MOOD_ICONS[e.mood]
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => handleSelect(e.entry_date)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border/40 bg-card/40 p-3 text-left transition-colors hover:border-primary/30 hover:bg-card/70"
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      MOOD_TONES[e.mood] ?? "bg-primary/15 text-primary"
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {shortDate(e.entry_date)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {MOOD_LABELS[e.mood]}
                      </span>
                    </span>
                    <span className="mt-0.5 line-clamp-1 block text-xs text-muted-foreground">
                      {e.content || "Sin nota escrita"}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Hoja inferior móvil para un día concreto */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[92dvh] px-4 pb-4">
          <SheetHeader>
            <SheetTitle className="text-base capitalize">
              {new Date(`${selected}T12:00:00`).toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </SheetTitle>
          </SheetHeader>
          <EntryEditor
            key={`sheet-${selected}`}
            date={selected}
            entry={selectedEntry}
            isToday={selected === today}
            inSheet
            onSaved={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
