"use client"

import { useRef, useState, useEffect, useCallback, useMemo } from "react"
import { animate, motion, useMotionValue, type PanInfo } from "framer-motion"
import { SPRING_UI, SPRING_MOMENTUM, projectMomentum, nearestSnapPoint } from "@/lib/motion"
import { ChevronLeft, ChevronRight, Lock, Clock, BookOpen, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { MediaImage } from "@/components/media/media-image"
import Link from "next/link"
import { difficultyStyle, difficultyLabel } from "@/lib/status-styles"

interface Formation {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail_url: string | null
  difficulty: string | null
  duration_minutes: number | null
  is_premium: boolean | null
  xp_reward: number | null
}

interface FormationsCarouselProps {
  formations: Formation[]
}

const CARD_WIDTH = 320
const CARD_GAP = 24
/** En móvil la tarjeta se encoge para que se intuya la siguiente. */
const MIN_CARD_WIDTH = 260

// Velo inferior para que el texto se lea sobre la portada.
//
// Antes había cinco variantes de degradado y cinco de fondo, rotando
// por índice: amber-950/85, stone-950/85, zinc-950/85, slate-950/85 y
// neutral-950/85. A esa opacidad los cinco son el mismo negro — la
// apariencia de un sistema con variantes sin ninguna diferencia
// perceptible. Un solo velo, bien calibrado, hace el trabajo.
const SCRIM = "from-black/85 via-black/35 to-transparent"

// Fondo mientras carga la portada. Un único tono cálido ligado al oro
// de marca en lugar de cinco mezclas de grises indistinguibles.
const COVER_FALLBACK = "bg-gradient-to-br from-primary/15 via-muted to-surface-soft"

function FormationCard({
  formation,
  cardWidth,
}: {
  formation: Formation
  cardWidth: number
}) {
  const diff = formation.difficulty ?? "beginner"

  const cardContent = (
    <motion.div
      className="group relative flex-shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-border/50 bg-card"
      style={{ width: cardWidth, height: 420 }}
      // Pasar el ratón por encima no imprime momento a nada, así que la
      // tarjeta no rebota: llega y se queda (§4).
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.99 }}
      transition={SPRING_UI}
    >
      {/* Thumbnail / Background */}
      <div className={`absolute inset-0 ${COVER_FALLBACK}`}>
        <MediaImage
          src={formation.thumbnail_url}
          alt={formation.title}
          seed={formation.slug}
          fill
          sizes="320px"
          className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
        />
      </div>

      {/* Gradient overlay — suave, para que la portada siga siendo legible */}
      <div className={`absolute inset-0 bg-gradient-to-t ${SCRIM}`} />

      {/* Gold top bar */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 [@media(hover:none)]:opacity-100" />

      {/* Top badges */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
        <Badge className={`text-xs border ${difficultyStyle(diff)}`}>
          {difficultyLabel(diff)}
        </Badge>
        {formation.is_premium && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30">
            <Lock className="h-3 w-3 text-primary" />
          </div>
        )}
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h3 className="font-display mb-2 text-2xl font-light leading-tight text-white transition-colors duration-300 ease-out group-hover:text-primary">
          {formation.title}
        </h3>
        {formation.description && (
          <p className="mb-4 text-sm text-white/70 line-clamp-2 leading-relaxed">
            {formation.description}
          </p>
        )}
        <div className="flex items-center gap-4 text-xs text-white/60">
          {formation.duration_minutes && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              {Math.floor(formation.duration_minutes / 60)}h {formation.duration_minutes % 60 > 0 ? `${formation.duration_minutes % 60}m` : ""}
            </span>
          )}
          {formation.xp_reward && (
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-primary/70" />
              {formation.xp_reward} XP
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )

  return <Link href={`/formations/${formation.slug}`}>{cardContent}</Link>
}

export function FormationsCarousel({ formations }: FormationsCarouselProps) {
  const data = formations
  const trackRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(true)
  const [isDragging, setIsDragging] = useState(false)

  // Una sola fuente de verdad. Antes había dos: `x` y un `springX`
  // derivado. El arrastre movía uno, las flechas el otro, y las
  // comprobaciones sumaban el desplazamiento de uno al valor del otro,
  // así que tras arrastrar las flechas saltaban a la posición anterior.
  //
  // Además el muelle estaba *entre el dedo y el contenido*: la tira
  // perseguía al dedo con retraso en lugar de ir pegada a él. El
  // arrastre es ahora 1:1 (§2) y el muelle sólo actúa al soltar (§5).
  const x = useMotionValue(0)

  // El ancho se mide en el cliente con ResizeObserver. Antes se leía
  // `window.innerWidth` durante el render (desajuste con el SSR y sin
  // reaccionar al giro de pantalla), lo que dejaba los límites de
  // arrastre mal calculados.
  const [containerWidth, setContainerWidth] = useState(1200)

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width)
    })
    observer.observe(el)
    setContainerWidth(el.clientWidth)
    return () => observer.disconnect()
  }, [])

  const cardWidth = Math.max(
    MIN_CARD_WIDTH,
    Math.min(CARD_WIDTH, containerWidth - 56)
  )
  const step = cardWidth + CARD_GAP
  const totalWidth = data.length * step - CARD_GAP
  const maxX = 0
  const minX = Math.min(0, -(totalWidth - containerWidth))

  // Posiciones de reposo: una por tarjeta, recortadas a los límites.
  const snapPoints = useMemo(() => {
    const points = data.map((_, i) => Math.max(minX, Math.min(maxX, -i * step)))
    if (!points.includes(minX)) points.push(minX)
    return Array.from(new Set(points))
  }, [data, step, minX, maxX])

  const updateButtons = useCallback(
    (currentX: number) => {
      setCanPrev(currentX < maxX - 1)
      setCanNext(currentX > minX + 1)
    },
    [minX, maxX]
  )

  // Las flechas se derivan del valor real, no de una copia paralela.
  useEffect(() => {
    updateButtons(x.get())
    return x.on("change", updateButtons)
  }, [x, updateButtons])

  function handleDragEnd(_: unknown, info: PanInfo) {
    // No se aterriza donde quedó el dedo, sino donde habría acabado si
    // lo dejáramos decelerar: se proyecta el reposo y se busca la
    // tarjeta más cercana a ese punto (§6). Un flick lanza la tira.
    const projected = x.get() + projectMomentum(info.velocity.x)
    const target = nearestSnapPoint(
      Math.max(minX, Math.min(maxX, projected)),
      snapPoints
    )

    // La animación arranca con la velocidad exacta del dedo: no hay
    // costura entre arrastrar y animar (§5).
    animate(x, target, { ...SPRING_MOMENTUM, velocity: info.velocity.x })
  }

  function slide(direction: "prev" | "next") {
    const current = x.get()
    const raw = direction === "next" ? current - step : current + step
    const target = nearestSnapPoint(
      Math.max(minX, Math.min(maxX, raw)),
      snapPoints
    )
    // Un click no trae momento: llega sin rebotar.
    animate(x, target, SPRING_UI)
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card/50 px-6 py-12 text-sm text-muted-foreground">
        <BookOpen className="h-4 w-4" />
        <span>Próximamente nuevas formaciones disponibles</span>
      </div>
    )
  }

  return (
    <div className="relative w-full">
      {/* Navigation arrows — en móvil sobra: la tira se arrastra con el dedo */}
      <div className="mb-6 hidden items-center justify-end gap-2 px-4 sm:flex lg:px-0">
        <motion.button
          onClick={() => slide("prev")}
          disabled={!canPrev}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-card text-foreground disabled:opacity-30 hover:border-primary/50 hover:text-primary transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </motion.button>
        <motion.button
          onClick={() => slide("next")}
          disabled={!canNext}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-card text-foreground disabled:opacity-30 hover:border-primary/50 hover:text-primary transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </motion.button>
      </div>

      {/* Track */}
      <div className="overflow-hidden px-4 lg:px-0" ref={trackRef}>
        <motion.div
          className="flex"
          style={{ x, gap: CARD_GAP, cursor: isDragging ? "grabbing" : "grab" }}
          drag="x"
          dragConstraints={{ left: minX, right: maxX }}
          // 0.08 era prácticamente un tope duro. Con 0.25 el borde
          // resiste de forma progresiva en vez de congelarse (§9).
          dragElastic={0.25}
          // El aterrizaje lo decide handleDragEnd con proyección de
          // momento, no la inercia genérica de Framer.
          dragMomentum={false}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={(event, info) => {
            setIsDragging(false)
            handleDragEnd(event, info)
          }}
        >
          {data.map((formation, i) => (
            <motion.div
              key={formation.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              // El escalonado se recorta a las primeras tarjetas: con
              // i * 0.08 sin tope, la quinta tardaba casi medio segundo
              // en existir (§1).
              transition={{ duration: 0.35, delay: Math.min(i, 3) * 0.06, ease: "easeOut" }}
            >
              <FormationCard formation={formation} cardWidth={cardWidth} />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent lg:hidden" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent lg:hidden" />

    </div>
  )
}
