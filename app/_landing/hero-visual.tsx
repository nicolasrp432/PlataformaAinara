"use client"

import Image from "next/image"
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion"
import type { PointerEvent } from "react"

export function HeroVisual() {
  const reduced = useReducedMotion()
  const x = useSpring(useMotionValue(0), { stiffness: 90, damping: 22 })
  const y = useSpring(useMotionValue(0), { stiffness: 90, damping: 22 })

  function respondToPointer(event: PointerEvent<HTMLElement>) {
    if (reduced || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return
    const bounds = event.currentTarget.getBoundingClientRect()
    x.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 8)
    y.set(((event.clientY - bounds.top) / bounds.height - 0.5) * 8)
  }

  function resetPointer() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.figure
      className="ainara-hero-art"
      aria-label="Una semilla germinando con raíces visibles, símbolo de empezar desde la raíz"
      onPointerMove={respondToPointer}
      onPointerLeave={resetPointer}
      initial={reduced ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="hero-visual-image"
        style={{ x, y }}
        animate={reduced ? undefined : { translateY: [0, -5, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <Image
          src="/mitra-seedling.png"
          alt=""
          width={600}
          height={720}
          priority
          sizes="(max-width: 767px) 82vw, (max-width: 1279px) 42vw, 500px"
          className="h-auto w-full"
        />
      </motion.div>
      <motion.span className="hero-particle hero-particle-one" aria-hidden="true" animate={reduced ? undefined : { y: [0, -7, 0], opacity: [.35, .8, .35] }} transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }} />
      <motion.span className="hero-particle hero-particle-two" aria-hidden="true" animate={reduced ? undefined : { y: [0, 6, 0], opacity: [.3, .7, .3] }} transition={{ duration: 6.2, repeat: Infinity, ease: "easeInOut" }} />
    </motion.figure>
  )
}
