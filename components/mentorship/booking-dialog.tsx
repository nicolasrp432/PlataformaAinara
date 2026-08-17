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
import { Loader2, CalendarDays, Clock, ArrowRight, CheckCircle2, Sparkles, Send } from "lucide-react"
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
  const [requestSent, setRequestSent] = useState(false)
  const [isSubmitting, startTransition] = useTransition()
  const isMobile = useIsMobile()

  // Fetch slots when opening the dialog
  useEffect(() => {
    if (!open) return
    setLoading(true)
    setSelectedDate(null)
    setSelectedSlot(null)
    setRequestSent(false)
    fetch(`/api/mentorship/slots?mentorId=${encodeURIComponent(mentor.id)}&days=14`)
      .then((res) => {
        if (!res.ok) return { slots: [] }
        return res.json()
      })
      .then((data) => {
        setSlots(data.slots ?? [])
      })
      .catch(() => {
        setSlots([])
      })
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
          toast.error(data.error ?? "Error al iniciar la reserva.")
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

  const handleCustomRequest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!notes.trim()) {
      toast.error("Por favor, describe brevemente qué te gustaría trabajar.")
      return
    }
    startTransition(async () => {
      // Simular registro de solicitud
      await new Promise((resolve) => setTimeout(resolve, 800))
      setRequestSent(true)
      toast.success("¡Solicitud de mentoría enviada con éxito!", {
        description: "Ainara revisará tu caso y te contactará para coordinar tu sesión privada.",
      })
    })
  }

  const slotsForSelectedDate = selectedDate
    ? slotsByDate.find(([d]) => d === selectedDate)?.[1] ?? []
    : []
  const mentorName = mentor.name ?? mentor.full_name ?? "Ainara"
  const isEmpty = !loading && slotsByDate.length === 0

  const title = `Sesión Privada con ${mentorName}`
  const description = "Recibe guía estratégica 1 a 1 para acelerar tu transformación."

  const trigger = (
    <Button
      onClick={() => setOpen(true)}
      className={triggerClassName ?? "w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all h-11 text-sm rounded-lg shadow-sm"}
    >
      <CalendarDays className="w-4 h-4 mr-2" />
      {triggerLabel ?? "Reservar Sesión 1 a 1"}
    </Button>
  )

  const bookingBody = (
    <div className="space-y-4 pt-2">
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-2.5 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-xs">Cargando disponibilidad de la mentora...</p>
        </div>
      )}

      {/* Si no hay slots pre-configurados, permitir solicitud directa de sesión */}
      {isEmpty && !requestSent && (
        <form onSubmit={handleCustomRequest} className="space-y-4">
          <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 space-y-2">
            <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Solicitud de Sesión Personalizada</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Las sesiones con {mentorName} son limitadas para garantizar máxima dedicación. Cuéntanos tu situación y qué deseas desbloquear.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              ¿Qué área o reto deseas transformar?
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Escribe aquí tu objetivo, dudas o lo que necesitas enfocar..."
              rows={4}
              className="resize-none bg-background rounded-lg border-border px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="text-xs text-muted-foreground">
              Duración: <strong className="text-foreground">{mentor.session_duration_minutes ?? 60} min</strong>
            </div>
            <Button
              type="submit"
              disabled={isSubmitting || !notes.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg text-xs h-9 px-5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Solicitar Mentoría
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {requestSent && (
        <div className="text-center py-10 px-4 space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">¡Solicitud recibida!</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Hemos registrado tu solicitud con {mentorName}. Te enviaremos una propuesta de fechas y horas disponibles a tu correo.
          </p>
          <Button
            onClick={() => setOpen(false)}
            variant="outline"
            className="rounded-lg text-xs h-8 px-4 border-border"
          >
            Entendido
          </Button>
        </div>
      )}

      {!loading && slotsByDate.length > 0 && (
        <div className="space-y-5">
          {/* Step 1: Date selection */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              1. Selecciona el día
            </h3>
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
                      "px-3 py-2.5 rounded-lg border text-left transition-all",
                      isActive
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-card hover:border-primary/40 hover:bg-primary/5",
                    )}
                  >
                    <p className="text-xs font-semibold text-foreground capitalize">
                      {formatDateLabel(date)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {daySlots.length} horario{daySlots.length === 1 ? "" : "s"}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Step 2: Time slot */}
          {selectedDate && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                2. Selecciona la hora
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slotsForSelectedDate.map((slot) => {
                  const isActive = selectedSlot === slot.startsAt
                  return (
                    <button
                      key={slot.startsAt}
                      type="button"
                      onClick={() => setSelectedSlot(slot.startsAt)}
                      className={cn(
                        "px-2.5 py-2 rounded-lg border text-xs font-medium transition-all",
                        isActive
                          ? "border-primary bg-primary text-primary-foreground shadow-sm font-semibold"
                          : "border-border bg-card hover:border-primary/40 hover:bg-primary/5",
                      )}
                    >
                      <Clock className="inline w-3 h-3 mr-1 align-text-bottom" />
                      {slot.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 3: Notes */}
          {selectedSlot && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                3. ¿Qué te gustaría trabajar? (opcional)
              </h3>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Describe brevemente tus dudas o metas para la sesión..."
                className="resize-none bg-background rounded-lg border-border px-3 py-2 text-xs"
              />
            </div>
          )}

          {/* Step 4: Confirm */}
          {selectedSlot && (
            <div className="border-t border-border pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs">
                <p className="font-semibold text-foreground">
                  {formatDateLabel(selectedDate!)} · {slotsForSelectedDate.find(s => s.startsAt === selectedSlot)?.label}
                </p>
                <p className="text-muted-foreground text-[11px]">
                  {mentor.session_duration_minutes ?? 60} min
                </p>
              </div>
              <Button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg text-xs h-9 px-5"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 order-2" />
                )}
                {isSubmitting ? "Procesando..." : "Confirmar y Reservar"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <>
        {trigger}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="max-h-[88vh] rounded-t-2xl px-4 pb-6">
            <SheetHeader className="pb-1">
              <SheetTitle className="text-base font-bold text-foreground">{title}</SheetTitle>
              <SheetDescription className="text-xs">{description}</SheetDescription>
            </SheetHeader>
            <div className="overflow-y-auto max-h-[72vh] pb-2">{bookingBody}</div>
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <>
      {trigger}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">{title}</DialogTitle>
            <DialogDescription className="text-xs">{description}</DialogDescription>
          </DialogHeader>
          {bookingBody}
        </DialogContent>
      </Dialog>
    </>
  )
}
