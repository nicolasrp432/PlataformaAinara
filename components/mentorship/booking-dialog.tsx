"use client"

import { useState, useEffect, useMemo, useTransition } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, CalendarDays, Clock, ArrowRight, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/lib/hooks/use-is-mobile"

interface MentorBookingProps {
  mentor: {
    id: string
    name?: string | null
    full_name?: string | null
    session_price?: number | null
    session_duration_minutes?: number | null
  }
  triggerLabel?: string
  triggerClassName?: string
}

interface Slot {
  startsAt: string
  label: string
  date: string
}

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
const MONTH_NAMES_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

function formatDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  return `${DAY_NAMES[date.getDay()]} ${d} ${MONTH_NAMES_SHORT[m - 1]}`
}

export function MentorshipBookingDialog({ mentor, triggerLabel, triggerClassName }: MentorBookingProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [isSubmitting, startTransition] = useTransition()
  const isMobile = useIsMobile()

  // Fetch slots when opening the dialog
  useEffect(() => {
    if (!open) return
    setLoading(true)
    setSelectedDate(null)
    setSelectedSlot(null)
    fetch(`/api/mentorship/slots?mentorId=${encodeURIComponent(mentor.id)}&days=14`)
      .then((res) => res.json())
      .then((data) => {
        setSlots(data.slots ?? [])
      })
      .catch(() => toast.error("No se pudieron cargar los horarios."))
      .finally(() => setLoading(false))
  }, [open, mentor.id])

  const slotsByDate = useMemo(() => {
    const map = new Map<string, Slot[]>()
    for (const s of slots) {
      const arr = map.get(s.date) ?? []
      arr.push(s)
      map.set(s.date, arr)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
  }, [slots])

  const handleConfirm = () => {
    if (!selectedSlot) return
    startTransition(async () => {
      try {
        const res = await fetch("/api/mentorship/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mentorId: mentor.id,
            scheduledAt: selectedSlot,
            notes: notes.trim() || undefined,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error ?? "Error al iniciar el pago.")
          return
        }
        if (data.url) {
          window.location.href = data.url
        }
      } catch {
        toast.error("Error de red. Inténtalo de nuevo.")
      }
    })
  }

  const slotsForSelectedDate = selectedDate
    ? slotsByDate.find(([d]) => d === selectedDate)?.[1] ?? []
    : []
  const mentorName = mentor.name ?? mentor.full_name ?? "Mentor"
  const isEmpty = !loading && slotsByDate.length === 0

  const title = `Reservar mentoría con ${mentorName}`
  const description = "Elige un día y horario disponible. Se confirmará tras el pago."

  const trigger = (
    <Button
      onClick={() => setOpen(true)}
      className={triggerClassName ?? "w-full mt-6 bg-foreground text-background hover:bg-primary hover:text-primary-foreground transition-all duration-300 h-12 text-base shadow-lg"}
    >
      <CalendarDays className="w-5 h-5 mr-2" />
      {triggerLabel ?? "Reservar Sesión"}
    </Button>
  )

  const bookingBody = (
    <>
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-sm">Cargando horarios disponibles...</p>
          </div>
        )}

        {isEmpty && (
          <div className="text-center py-12 px-4 border border-dashed border-border/50 rounded-xl">
            <CalendarDays className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-foreground font-medium mb-1">No hay horarios disponibles</p>
            <p className="text-sm text-muted-foreground">
              Próximamente publicaremos nueva disponibilidad. Vuelve más tarde.
            </p>
          </div>
        )}

        {!loading && slotsByDate.length > 0 && (
          <div className="space-y-6 mt-2">
            {/* Step 1: Date selection */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Elige el día</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {slotsByDate.map(([date, daySlots]) => {
                  const isActive = selectedDate === date
                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => {
                        setSelectedDate(date)
                        setSelectedSlot(null)
                      }}
                      className={cn(
                        "px-3 py-3 rounded-xl border text-left transition-all",
                        isActive
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border/50 bg-background hover:border-primary/30 hover:bg-muted/30",
                      )}
                    >
                      <p className="text-sm font-medium text-foreground capitalize">
                        {formatDateLabel(date)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {daySlots.length} horario{daySlots.length === 1 ? "" : "s"}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 2: Time slot */}
            {selectedDate && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Elige la hora</h3>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slotsForSelectedDate.map((slot) => {
                    const isActive = selectedSlot === slot.startsAt
                    return (
                      <button
                        key={slot.startsAt}
                        type="button"
                        onClick={() => setSelectedSlot(slot.startsAt)}
                        className={cn(
                          "px-3 py-2.5 rounded-lg border text-sm font-medium transition-all",
                          isActive
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "border-border/50 bg-background hover:border-primary/40 hover:bg-muted/30",
                        )}
                      >
                        <Clock className="inline w-3.5 h-3.5 mr-1.5 align-text-bottom" />
                        {slot.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Notes */}
            {selectedSlot && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">¿Sobre qué quieres trabajar? (opcional)</h3>
                </div>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Cuéntale brevemente al mentor qué te gustaría profundizar..."
                  maxLength={1000}
                  className="resize-none bg-background border-border/50 focus-visible:ring-1 focus-visible:ring-primary/30"
                />
                <p className="text-xs text-muted-foreground mt-1.5 text-right">
                  {notes.length}/1000
                </p>
              </div>
            )}

            {/* Step 4: Confirm + price */}
            {selectedSlot && (
              <div className="border-t border-border/50 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {formatDateLabel(selectedDate!)} · {slotsForSelectedDate.find(s => s.startsAt === selectedSlot)?.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {mentor.session_duration_minutes ?? 60} min ·{" "}
                      <Badge variant="secondary" className="ml-1">
                        {mentor.session_price ? `${mentor.session_price} €` : "Precio a confirmar"}
                      </Badge>
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground sm:min-w-[180px]"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRight className="w-4 h-4 ml-2 order-2" />
                  )}
                  {isSubmitting ? "Redirigiendo..." : "Pagar y reservar"}
                </Button>
              </div>
            )}
          </div>
        )}
    </>
  )

  if (isMobile) {
    return (
      <>
        {trigger}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="h-[92vh]">
            <SheetHeader>
              <SheetTitle className="text-xl font-semibold">{title}</SheetTitle>
              <SheetDescription>{description}</SheetDescription>
            </SheetHeader>
            <div className="overflow-y-auto pb-4">{bookingBody}</div>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <>
      {trigger}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {bookingBody}
        </DialogContent>
      </Dialog>
    </>
  )
}
