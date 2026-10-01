"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Flame, NotebookPen, ChevronLeft, ChevronRight, Filter } from "lucide-react"
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

function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
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
  const [moodFilter, setMoodFilter] = React.useState<string>("all")

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

  const handlePrevDay = () => {
    const prev = shiftDate(selected, -1)
    handleSelect(prev)
  }

  const handleNextDay = () => {
    if (selected >= today) return
    const next = shiftDate(selected, 1)
    handleSelect(next)
  }

  // Filtrado de entradas pasadas por emoción
  const filteredRecent = recent.filter((e) => {
    if (moodFilter === "all") return true
    return e.mood === moodFilter
  })

  const availableMoods = Array.from(new Set(recent.map((e) => e.mood)))

  // En escritorio la tarjeta muestra el día seleccionado; en móvil se queda
  // siempre en hoy y los días pasados se abren en una hoja inferior.
  const inlineDate = isMobile ? today : selected
  const inlineEntry = isMobile ? todayEntry : selectedEntry

  return (
    <div className="ainara-journal relative mx-auto max-w-5xl space-y-6">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-96 w-[min(24rem,100%)] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="ainara-page-header flex flex-col gap-3"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Badge className="mb-2 border border-primary/25 bg-primary/15 px-3 py-1 text-3xs uppercase tracking-widest text-primary hover:bg-primary/20">
              Diario privado
            </Badge>
            <h1 className="text-2xl font-light tracking-tight text-foreground sm:text-4xl">
              Un momento <span className="font-semibold text-primary">para ti.</span>
            </h1>
            <p className="mt-1 font-display text-base capitalize text-muted-foreground sm:text-lg">
              {dateLabel}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-start rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2 sm:flex-col sm:gap-1 sm:py-3 shadow-xs">
            <Flame className="h-5 w-5 text-primary" />
            <span className="text-xl font-bold leading-none text-foreground">
              {streak}
            </span>
            <span className="text-3xs uppercase tracking-wider text-muted-foreground font-medium">
              {streak === 1 ? "día" : "días"} de racha
            </span>
          </div>
        </div>

        <p className="max-w-lg text-sm text-muted-foreground leading-relaxed">
          Un espacio íntimo y seguro para volver a ti. Registra tu verdad diaria; solo tú tienes acceso a estas reflexiones.
        </p>
      </motion.div>

      {/* Calendario */}
      <motion.div
        className="ainara-journal-calendar"
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
        className="ainara-journal-editor"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.45 }}
      >
        <Card className="overflow-hidden border-border/70 bg-card/75 shadow-lg shadow-black/5 backdrop-blur-xl md:shadow-xl rounded-2xl">
          <div className="h-1.5 gold-gradient" />
          
          {/* Navegador entre fechas */}
          {!isMobile && (
            <div className="flex items-center justify-between px-6 pt-4 pb-1 border-b border-border/40 text-xs text-muted-foreground">
              <button
                type="button"
                onClick={handlePrevDay}
                className="flex items-center gap-1 hover:text-foreground transition-colors py-1 px-2 rounded-md hover:bg-muted/40 font-medium"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Día anterior</span>
              </button>

              <span className="font-semibold text-foreground text-xs capitalize">
                {new Date(`${inlineDate}T12:00:00`).toLocaleDateString("es-ES", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
                {inlineDate === today && " (Hoy)"}
              </span>

              <button
                type="button"
                onClick={handleNextDay}
                disabled={inlineDate >= today}
                className="flex items-center gap-1 hover:text-foreground transition-colors py-1 px-2 rounded-md hover:bg-muted/40 font-medium disabled:opacity-30 disabled:pointer-events-none"
              >
                <span>Día siguiente</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <CardContent className="p-4 sm:p-7">
            <EntryEditor
              key={`inline-${inlineDate}`}
              date={inlineDate}
              entry={inlineEntry}
              isToday={inlineDate === today}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Historial con filtro por estado de ánimo */}
      {recent.length > 0 && (
        <div className="ainara-journal-history space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="label-luxury flex items-center gap-2">
              <NotebookPen className="h-3.5 w-3.5 text-primary" />
              Tus últimas entradas ({filteredRecent.length})
            </h2>

            {/* Filtro por emoción */}
            {availableMoods.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
                <Filter className="h-3 w-3 text-muted-foreground shrink-0 ml-1" />
                <button
                  type="button"
                  onClick={() => setMoodFilter("all")}
                  className={cn(
                    "text-3xs font-semibold px-2 py-0.5 rounded-md border transition-colors shrink-0",
                    moodFilter === "all"
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border/60 text-muted-foreground hover:text-foreground"
                  )}
                >
                  Todas
                </button>
                {availableMoods.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMoodFilter(m)}
                    className={cn(
                      "text-3xs font-semibold px-2 py-0.5 rounded-md border transition-colors shrink-0",
                      moodFilter === m
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border/60 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {MOOD_LABELS[m] || m}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            {filteredRecent.slice(0, 10).map((e) => {
              const Icon = MOOD_ICONS[e.mood]
              const isCurrentSelected = selected === e.entry_date
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => handleSelect(e.entry_date)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all duration-150 active:scale-[0.99]",
                    isCurrentSelected
                      ? "border-primary/50 bg-primary/10 shadow-xs"
                      : "border-border/60 bg-card/60 hover:border-primary/30 hover:bg-card/90"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-xs",
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
                    <span className="mt-0.5 line-clamp-1 block text-xs text-muted-foreground/90">
                      {e.content || "Sin nota escrita adicional"}
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
        <SheetContent side="bottom" className="max-h-[92dvh]" contentClassName="px-4 pb-4">
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
