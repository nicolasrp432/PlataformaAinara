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
      aria-label="Una figura humana acompañada por raíces y vínculos que crecen formando una M"
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
          src="/mitra-hero.svg"
          alt=""
          width={960}
          height={1200}
          sizes="(max-width: 767px) 88vw, (max-width: 1279px) 46vw, 560px"
          className="h-auto w-full"
        />
      </motion.div>
      <motion.svg className="hero-root-light" viewBox="0 0 320 400" aria-hidden="true" animate={reduced ? undefined : { opacity: [0.38, 0.68, 0.38], y: [0, 3, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}>
        <path d="M160 252c-2 45-31 72-66 102M160 252c2 45 31 72 66 102M160 275v98" />
      </motion.svg>
      <motion.span className="hero-particle hero-particle-one" aria-hidden="true" animate={reduced ? undefined : { y: [0, -7, 0], opacity: [.35, .8, .35] }} transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }} />
      <motion.span className="hero-particle hero-particle-two" aria-hidden="true" animate={reduced ? undefined : { y: [0, 6, 0], opacity: [.3, .7, .3] }} transition={{ duration: 6.2, repeat: Infinity, ease: "easeInOut" }} />
    </motion.figure>
  )
}
