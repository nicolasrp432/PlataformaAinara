"use client"

import { motion, useReducedMotion, useSpring, useMotionValue, useTransform } from "framer-motion"
import { type ReactNode, useRef } from "react"

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: "up" | "down" | "left" | "right" | "none"
  distance?: number
  duration?: number
}

export function Reveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  distance = 32,
  duration = 0.8,
}: RevealProps) {
  const reduced = useReducedMotion()

  const offset = {
    up: { y: distance, x: 0 },
    down: { y: -distance, x: 0 },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
    none: { x: 0, y: 0 },
  }[direction]

  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, ...offset }}
      whileInView={reduced ? undefined : { opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

export function FloatingVisual({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, scale: 0.94, rotate: 1.5 }}
      animate={
        reduced
          ? undefined
          : {
              opacity: 1,
              scale: 1,
              rotate: 0,
              y: [0, -8, 0],
            }
      }
      transition={{
        opacity: { duration: 0.8 },
        scale: { duration: 0.8 },
        rotate: { duration: 0.8 },
        y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.8 },
      }}
    >
      {children}
    </motion.div>
  )
}

/** Stagger container for lists and grids */
export function StaggerContainer({
  children,
  className = "",
  staggerDelay = 0.12,
}: {
  children: ReactNode
  className?: string
  staggerDelay?: number
}) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduced ? false : "hidden"}
      whileInView={reduced ? undefined : "show"}
      viewport={{ once: true, amount: 0.12 }}
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      className={className}
      variants={
        reduced
          ? undefined
          : {
              hidden: { opacity: 0, y: 24, scale: 0.98 },
              show: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
              },
            }
      }
    >
      {children}
    </motion.div>
  )
}

/** 3D interactive Card Tilt with smooth spring physics */
export function CardTilt({
  children,
  className = "",
  tiltMax = 7,
}: {
  children: ReactNode
  className?: string
  tiltMax?: number
}) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const x = useSpring(useMotionValue(0), { stiffness: 120, damping: 20 })
  const y = useSpring(useMotionValue(0), { stiffness: 120, damping: 20 })

  const rotateX = useTransform(y, [-0.5, 0.5], [tiltMax, -tiltMax])
  const rotateY = useTransform(x, [-0.5, 0.5], [-tiltMax, tiltMax])

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduced || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    x.set(px)
    y.set(py)
  }

  function handlePointerLeave() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={`transition-shadow duration-300 ${className}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        perspective: 1000,
        rotateX: reduced ? 0 : rotateX,
        rotateY: reduced ? 0 : rotateY,
        transformStyle: "preserve-3d",
      }}
      whileHover={reduced ? undefined : { y: -4 }}
    >
      {children}
    </motion.div>
  )
}

/** Subtle Magnetic button attraction effect */
export function Magnetic({
  children,
  className = "",
  strength = 14,
}: {
  children: ReactNode
  className?: string
  strength?: number
}) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const x = useSpring(0, { stiffness: 150, damping: 15 })
  const y = useSpring(0, { stiffness: 150, damping: 15 })

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduced || !ref.current) return
    const { clientX, clientY } = e
    const { left, top, width, height } = ref.current.getBoundingClientRect()
    const middleX = clientX - (left + width / 2)
    const middleY = clientY - (top + height / 2)
    x.set((middleX / width) * strength)
    y.set((middleY / height) * strength)
  }

  function handleMouseLeave() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: reduced ? 0 : x, y: reduced ? 0 : y }}
    >
      {children}
    </motion.div>
  )
}
