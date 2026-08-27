"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

/**
 * Barra de progreso de vídeo.
 *
 * No es el Slider de formulario: un scrubber tiene necesidades que un
 * control de formulario no tiene (skill apple-design §1, §10, §16).
 *
 *  · Área táctil de 44px aunque la barra mida 4: lo que se toca no es
 *    lo que se ve.
 *  · La barra engorda al agarrarla — el estado del gesto se ve, no se
 *    adivina.
 *  · Muestra el buffer descargado, así que "por qué se para aquí"
 *    tiene respuesta visible.
 *  · Muestra el tiempo mientras arrastras. §16: a veces añadir
 *    contexto es lo que simplifica.
 *  · El seek real va limitado a un frame (rAF). Antes se escribía
 *    `video.currentTime` en cada pointermove: un seek y una decodifica
 *    por evento, que es exactamente el precipicio de latencia del §1.
 */

interface VideoScrubberProps {
  currentTime: number
  duration: number
  buffered: number
  onSeek: (time: number) => void
  onScrubStart?: () => void
  onScrubEnd?: () => void
  formatTime: (seconds: number) => string
  className?: string
}

export function VideoScrubber({
  currentTime,
  duration,
  buffered,
  onSeek,
  onScrubStart,
  onScrubEnd,
  formatTime,
  className,
}: VideoScrubberProps) {
  const [isScrubbing, setIsScrubbing] = React.useState(false)
  // Mientras se arrastra manda la posición del dedo, no la del vídeo:
  // el feedback es continuo durante el gesto, no sólo al soltar (§1).
  const [previewTime, setPreviewTime] = React.useState<number | null>(null)
  const frameRef = React.useRef<number | null>(null)
  const pendingRef = React.useRef<number | null>(null)

  const max = duration || 100
  const displayTime = previewTime ?? currentTime
  const percent = max > 0 ? (displayTime / max) * 100 : 0
  const bufferedPercent = max > 0 ? Math.min((buffered / max) * 100, 100) : 0

  // Un seek por frame como mucho.
  const scheduleSeek = React.useCallback(
    (time: number) => {
      pendingRef.current = time
      if (frameRef.current !== null) return
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null
        if (pendingRef.current !== null) {
          onSeek(pendingRef.current)
          pendingRef.current = null
        }
      })
    },
    [onSeek]
  )

  React.useEffect(() => {
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    }
  }, [])

  function handleValueChange(value: number[]) {
    if (!isScrubbing) {
      setIsScrubbing(true)
      onScrubStart?.()
    }
    setPreviewTime(value[0])
    scheduleSeek(value[0])
  }

  function handleValueCommit(value: number[]) {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
    pendingRef.current = null
    onSeek(value[0])
    setPreviewTime(null)
    setIsScrubbing(false)
    onScrubEnd?.()
  }

  return (
    <div className={cn("group/scrub relative", className)}>
      {/* Tiempo flotante: sólo mientras se arrastra, anclado a la
          posición del dedo (§7: la información nace donde la miras). */}
      {isScrubbing && (
        <div
          className="pointer-events-none absolute -top-8 z-10 -translate-x-1/2 rounded-md bg-black/85 px-2 py-1 text-2xs font-medium tabular-nums text-white shadow-lg"
          style={{ left: `${percent}%` }}
        >
          {formatTime(displayTime)}
        </div>
      )}

      <SliderPrimitive.Root
        value={[displayTime]}
        max={max}
        step={0.1}
        onValueChange={handleValueChange}
        onValueCommit={handleValueCommit}
        aria-label="Progreso del vídeo"
        // El área de agarre mide 44px de alto aunque la barra mida 4.
        className="relative flex h-11 w-full touch-none select-none items-center"
      >
        <SliderPrimitive.Track
          className={cn(
            "relative w-full grow overflow-hidden rounded-full bg-white/25",
            // La barra engorda al agarrarla: el estado del gesto se ve.
            "transition-[height] duration-150 ease-out",
            isScrubbing ? "h-1.5" : "h-1 group-hover/scrub:h-1.5"
          )}
        >
          {/* Buffer descargado, por detrás del progreso. */}
          <div
            className="absolute inset-y-0 left-0 bg-white/30"
            style={{ width: `${bufferedPercent}%` }}
          />
          <SliderPrimitive.Range className="absolute h-full bg-primary" />
        </SliderPrimitive.Track>

        <SliderPrimitive.Thumb
          className={cn(
            "block rounded-full bg-primary shadow-md outline-none",
            "transition-[transform,opacity] duration-150 ease-out",
            "focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/50",
            // Ausente en reposo para no ensuciar el fotograma; presente
            // en cuanto hay intención de tocarlo.
            "h-3.5 w-3.5",
            isScrubbing
              ? "scale-125 opacity-100"
              : "scale-0 opacity-0 group-hover/scrub:scale-100 group-hover/scrub:opacity-100 focus-visible:scale-100 focus-visible:opacity-100"
          )}
        />
      </SliderPrimitive.Root>
    </div>
  )
}
