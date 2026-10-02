"use client"

import { motion, useReducedMotion } from "framer-motion"
import type { ReactNode } from "react"

export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduced = useReducedMotion()
  return <motion.div className={className} initial={reduced ? false : { opacity: 0, y: 28 }} whileInView={reduced ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.18 }} transition={{ duration: .7, delay, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>
}

export function FloatingVisual({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion()
  return <motion.div className={className} initial={reduced ? false : { opacity: 0, scale: .94, rotate: 1.5 }} animate={reduced ? undefined : { opacity: 1, scale: 1, rotate: 0, y: [0, -8, 0] }} transition={{ opacity: { duration: .8 }, scale: { duration: .8 }, rotate: { duration: .8 }, y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: .8 } }}>{children}</motion.div>
}
