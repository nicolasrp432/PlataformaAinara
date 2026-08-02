"use client"

import * as React from "react"
import { CalendarDays, ChevronLeft, ChevronRight, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DailyReflectionEntry } from "@/lib/data-access"
import { MOOD_ICONS, MOOD_LABELS, MOOD_TONES } from "./moods"

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"]

/** Fecha local en formato YYYY-MM-DD (sin desplazamientos de zona horaria). */
function toISODate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function parseISODate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

interface ReflectionCalendarProps {
  entries: DailyReflectionEntry[]
  today: string
  selected: string
  onSelect: (date: string) => void
}

/**
 * Calendario navegable que sustituye a la tira de 14 días: aquella no era
 * pulsable, medía ~480px dentro de 343px útiles y dejaba el día de hoy fuera
 * de pantalla al cargar. Aquí cada día es un objetivo táctil de 44px que abre
 * su entrada.
 */
export function ReflectionCalendar({
  entries,
  today,
  selected,
  onSelect,
}: ReflectionCalendarProps) {
  const byDate = React.useMemo(
    () => new Map(entries.map((e) => [e.entry_date, e])),
    [entries]
  )

  const todayDate = parseISODate(today)
  const [cursor, setCursor] = React.useState(
    () => new Date(todayDate.getFullYear(), todayDate.getMonth(), 1)
  )
  // En móvil se arranca en semana para no comerse media pantalla.
  const [expanded, setExpanded] = React.useState(false)

  const monthLabel = new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(cursor)

  const isCurrentMonth =
    cursor.getFullYear() === todayDate.getFullYear() &&
    cursor.getMonth() === todayDate.getMonth()

  // Celdas del mes, alineadas a lunes.
  const monthCells = React.useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const daysInMonth = new Date(
      cursor.getFullYear(),
      cursor.getMonth() + 1,
      0
    ).getDate()
    const leading = (first.getDay() + 6) % 7 // lunes = 0

    const cells: (string | null)[] = Array(leading).fill(null)
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(toISODate(new Date(cursor.getFullYear(), cursor.getMonth(), d)))
    }
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [cursor])

  // Semana de la fecha seleccionada (lunes → domingo).
  const weekCells = React.useMemo(() => {
    const base = parseISODate(selected)
    const offset = (base.getDay() + 6) % 7
    const monday = new Date(base)
    monday.setDate(base.getDate() - offset)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return toISODate(d)
    })
  }, [selected])

  const cells = expanded ? monthCells : weekCells

  const goMonth = (delta: number) => {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1))
    setExpanded(true)
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 p-3 backdrop-blur-xl sm:p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => goMonth(-1)}
          aria-label="Mes anterior"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => {
            // Al abrir el mes, situarse en el del día seleccionado.
            if (!expanded) {
              const base = parseISODate(selected)
              setCursor(new Date(base.getFullYear(), base.getMonth(), 1))
            }
            setExpanded((e) => !e)
          }}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold capitalize text-foreground transition-colors hover:bg-muted/50"
          aria-expanded={expanded}
        >
          <CalendarDays className="h-4 w-4 text-primary" />
          {expanded ? monthLabel : "Esta semana"}
        </button>

        <button
          type="button"
          onClick={() => goMonth(1)}
          disabled={isCurrentMonth}
          aria-label="Mes siguiente"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d, i) => (
          <span
            key={`${d}-${i}`}
            className="pb-1 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground/60"
          >
            {d}
          </span>
        ))}

        {cells.map((date, i) => {
          if (!date) return <span key={`empty-${i}`} className="h-11" />

          const entry = byDate.get(date)
          const Icon = entry ? MOOD_ICONS[entry.mood] : null
          const isToday = date === today
          const isSelected = date === selected
          const isFuture = date > today
          const dayNum = Number(date.slice(8, 10))

          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelect(date)}
              disabled={isFuture}
              aria-label={
                entry
                  ? `${dayNum} — ${MOOD_LABELS[entry.mood]}`
                  : `${dayNum} — sin entrada`
              }
              aria-current={isToday ? "date" : undefined}
              className={cn(
                "flex h-11 flex-col items-center justify-center gap-0.5 rounded-xl transition-colors",
                "disabled:pointer-events-none disabled:opacity-25",
                isSelected
                  ? "bg-primary/15 ring-2 ring-primary/50"
                  : "hover:bg-muted/60",
                isToday && !isSelected && "ring-1 ring-primary/40"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full",
                  entry
                    ? MOOD_TONES[entry.mood] ?? "bg-primary/15 text-primary"
                    : "bg-muted/40 text-muted-foreground/30"
                )}
              >
                {Icon ? <Icon className="h-3.5 w-3.5" /> : <Minus className="h-3 w-3" />}
              </span>
              <span
                className={cn(
                  "text-[10px] leading-none",
                  isToday ? "font-bold text-primary" : "text-muted-foreground/70"
                )}
              >
                {dayNum}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
