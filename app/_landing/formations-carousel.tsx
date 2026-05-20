"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"
import { ChevronLeft, ChevronRight, Lock, Clock, BookOpen, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

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

const difficultyColors: Record<string, string> = {
  beginner: "bg-emerald-500/20 text-emerald-700 border-emerald-300/50",
  intermediate: "bg-amber-500/20 text-amber-700 border-amber-300/50",
  advanced: "bg-rose-500/20 text-rose-700 border-rose-300/50",
}

const difficultyLabels: Record<string, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
}

// Placeholder cards when no formations are in DB yet
const PLACEHOLDER_FORMATIONS: Formation[] = [
  { id: "1", title: "Despertar de la Consciencia", slug: "#", description: "Un viaje profundo hacia el autoconocimiento y la expansión de tu ser.", thumbnail_url: null, difficulty: "intermediate", duration_minutes: 480, is_premium: true, xp_reward: 500 },
  { id: "2", title: "Sanación Emocional", slug: "#", description: "Herramientas prácticas para liberar patrones y sanar heridas del pasado.", thumbnail_url: null, difficulty: "beginner", duration_minutes: 360, is_premium: true, xp_reward: 400 },
  { id: "3", title: "Meditación Avanzada", slug: "#", description: "Técnicas de meditación profunda para estados elevados de consciencia.", thumbnail_url: null, difficulty: "advanced", duration_minutes: 600, is_premium: true, xp_reward: 700 },
  { id: "4", title: "Liderazgo Interior", slug: "#", description: "Desarrolla tu autoridad personal y lidera desde la autenticidad.", thumbnail_url: null, difficulty: "intermediate", duration_minutes: 420, is_premium: true, xp_reward: 550 },
  { id: "5", title: "Abundancia y Propósito", slug: "#", description: "Alinea tu vida con tu propósito y abre el flujo de la abundancia.", thumbnail_url: null, difficulty: "beginner", duration_minutes: 300, is_premium: false, xp_reward: 350 },
]

const CARD_WIDTH = 320
const CARD_GAP = 24

const gradients = [
  "from-amber-900/80 via-amber-800/60 to-transparent",
  "from-stone-900/80 via-stone-800/60 to-transparent",
  "from-zinc-900/80 via-zinc-800/60 to-transparent",
  "from-slate-900/80 via-slate-800/60 to-transparent",
  "from-neutral-900/80 via-neutral-800/60 to-transparent",
]

const bgColors = [
  "bg-gradient-to-br from-amber-900/20 via-amber-800/10 to-stone-900/20",
  "bg-gradient-to-br from-stone-800/20 via-amber-900/10 to-zinc-900/20",
  "bg-gradient-to-br from-zinc-900/20 via-stone-800/10 to-amber-900/20",
  "bg-gradient-to-br from-slate-900/20 via-zinc-800/10 to-stone-900/20",
  "bg-gradient-to-br from-neutral-800/20 via-amber-900/10 to-slate-900/20",
]

function FormationCard({ formation, index }: { formation: Formation; index: number }) {
  const diff = formation.difficulty ?? "beginner"
  const isPlaceholder = formation.slug === "#"

  const cardContent = (
    <motion.div
      className="relative flex-shrink-0 overflow-hidden rounded-2xl border border-border/50 bg-card cursor-pointer group"
      style={{ width: CARD_WIDTH, height: 420 }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Thumbnail / Background */}
      <div className={`absolute inset-0 ${bgColors[index % bgColors.length]}`}>
        {formation.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={formation.thumbnail_url}
            alt={formation.title}
            className="h-full w-full object-cover opacity-70 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 0.95, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: index * 0.5 }}
            >
              <Sparkles className="h-16 w-16 text-primary/30" />
            </motion.div>
          </div>
        )}
      </div>

      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-t ${gradients[index % gradients.length]}`} />

      {/* Gold top bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Top badges */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
        <Badge className={`text-xs border ${difficultyColors[diff] ?? difficultyColors.beginner}`}>
          {difficultyLabels[diff] ?? "Principiante"}
        </Badge>
        {formation.is_premium && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30">
            <Lock className="h-3 w-3 text-primary" />
          </div>
        )}
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h3 className="font-display mb-2 text-2xl font-light leading-tight text-white group-hover:text-primary transition-colors duration-300">
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

  if (isPlaceholder) return cardContent
  return <Link href={`/formations/${formation.slug}`}>{cardContent}</Link>
}

export function FormationsCarousel({ formations }: FormationsCarouselProps) {
  const data = formations.length > 0 ? formations : PLACEHOLDER_FORMATIONS
  const trackRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(true)
  const [isDragging, setIsDragging] = useState(false)

  const x = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 300, damping: 30 })

  const totalWidth = data.length * (CARD_WIDTH + CARD_GAP) - CARD_GAP
  const containerWidth = typeof window !== "undefined" ? Math.min(window.innerWidth - 64, 1280) : 1200
  const maxX = 0
  const minX = -(totalWidth - containerWidth)

  const updateButtons = useCallback((currentX: number) => {
    setCanPrev(currentX < 0)
    setCanNext(currentX > minX)
  }, [minX])

  useEffect(() => {
    updateButtons(x.get())
  }, [x, updateButtons])

  function slide(direction: "prev" | "next") {
    const step = CARD_WIDTH + CARD_GAP
    const current = x.get()
    const next = direction === "next"
      ? Math.max(current - step * 2, minX)
      : Math.min(current + step * 2, maxX)
    x.set(next)
    updateButtons(next)
  }

  return (
    <div className="relative w-full">
      {/* Navigation arrows */}
      <div className="mb-6 flex items-center justify-end gap-2 px-4 lg:px-0">
        <motion.button
          onClick={() => slide("prev")}
          disabled={!canPrev}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-card text-foreground disabled:opacity-30 hover:border-primary/50 hover:text-primary transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </motion.button>
        <motion.button
          onClick={() => slide("next")}
          disabled={!canNext}
          whileHover={{ scale: 1.1 }}
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
          style={{ x: springX, gap: CARD_GAP, cursor: isDragging ? "grabbing" : "grab" }}
          drag="x"
          dragConstraints={{ left: minX, right: maxX }}
          dragElastic={0.08}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={(_, info) => {
            setIsDragging(false)
            updateButtons(x.get() + info.offset.x)
          }}
          onDrag={(_, info) => updateButtons(x.get() + info.offset.x)}
        >
          {data.map((formation, i) => (
            <motion.div
              key={formation.id}
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
            >
              <FormationCard formation={formation} index={i} />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent lg:hidden" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent" />

      {/* Info below */}
      {formations.length === 0 && (
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          <span>Próximamente más formaciones disponibles</span>
        </div>
      )}
    </div>
  )
}
