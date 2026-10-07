"use client"

import Image from "next/image"
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion"
import { useState, type PointerEvent } from "react"
import { GoldMatrixGlitch } from "./gold-matrix-glitch"

interface MentorVisualProps {
  portrait: string
  alt: string
  experienceLabel: string
}

export function MentorVisual({ portrait, alt, experienceLabel }: MentorVisualProps) {
  const reduced = useReducedMotion()
  const [isHovered, setIsHovered] = useState(false)

  // 3D Tilt Spring Physics
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springConfig = { stiffness: 100, damping: 20 }
  const x = useSpring(mouseX, springConfig)
  const y = useSpring(mouseY, springConfig)

  const rotateX = useTransform(y, [-20, 20], [8, -8])
  const rotateY = useTransform(x, [-20, 20], [-8, 8])
  const glareX = useTransform(x, [-20, 20], ["15%", "85%"])
  const glareY = useTransform(y, [-20, 20], ["15%", "85%"])

  function respondToPointer(event: PointerEvent<HTMLElement>) {
    if (reduced || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const px = (event.clientX - bounds.left) / bounds.width - 0.5
    const py = (event.clientY - bounds.top) / bounds.height - 0.5
    mouseX.set(px * 30)
    mouseY.set(py * 30)
  }

  function handlePointerEnter() {
    setIsHovered(true)
  }

  function resetPointer() {
    setIsHovered(false)
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <motion.div
      className="relative select-none"
      onPointerMove={respondToPointer}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={resetPointer}
      initial={reduced ? false : { opacity: 0, y: 32, scale: 0.95 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 1200 }}
    >
      {/* Dynamic Golden Ambient Backlight */}
      <motion.div
        className="pointer-events-none absolute -inset-8 -z-10 rounded-full bg-gradient-to-tr from-[#f6d25c40] via-[#8d681630] to-[#fff3bd20] blur-3xl"
        animate={
          reduced
            ? undefined
            : {
                scale: isHovered ? [1, 1.15, 1] : [1, 1.05, 1],
                opacity: isHovered ? 0.9 : 0.6,
              }
        }
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Main Mentor Frame with 3D Tilt */}
      <motion.div
        className="mentor-frame group relative overflow-hidden rounded-[3rem] p-3 md:p-4 shadow-2xl transition-all duration-300"
        style={{
          rotateX: reduced ? 0 : rotateX,
          rotateY: reduced ? 0 : rotateY,
          transformStyle: "preserve-3d",
          background:
            "linear-gradient(135deg, rgba(246, 210, 92, 0.9), rgba(255, 243, 189, 0.5) 45%, rgba(141, 104, 22, 0.85))",
          boxShadow: isHovered
            ? "0 35px 90px rgba(0, 0, 0, 0.6), 0 0 40px rgba(246, 210, 92, 0.35)"
            : "0 30px 80px rgba(0, 0, 0, 0.5)",
        }}
        animate={
          reduced
            ? undefined
            : {
                y: [0, -6, 0],
              }
        }
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Animated Golden Border Flow Beam */}
        <div
          className="pointer-events-none absolute -inset-[2px] rounded-[3.1rem] opacity-75 blur-[1px] transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "conic-gradient(from 0deg, #F6D25C, #FFE885, #8D6816, #FFFDF2, #F6D25C)",
            animation: "spin 12s linear infinite",
          }}
        />

        {/* Inner Image Container */}
        <div className="mentor-frame-image relative min-h-[28rem] md:min-h-[34rem] overflow-hidden rounded-[2.3rem] bg-[#1a1713]">
          {/* Base Portrait */}
          <Image
            src={portrait}
            alt={alt}
            fill
            sizes="(max-width: 1023px) 100vw, 42vw"
            className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            priority={false}
          />

          {/* Interactive Golden Matrix Glitch Canvas */}
          <GoldMatrixGlitch
            className="z-20"
            activeRadius={220}
            sliceIntensity={1.1}
            particleCount={30}
            glowColor="#F6D25C"
          />

          {/* Glare Sheen following cursor */}
          <motion.div
            className="pointer-events-none absolute inset-0 z-22 opacity-0 mix-blend-overlay transition-opacity duration-300 group-hover:opacity-40"
            style={{
              background: `radial-gradient(circle 300px at ${glareX} ${glareY}, rgba(255, 255, 255, 0.8), transparent 70%)`,
            }}
          />

          {/* Cyber-spiritual matrix scanlines */}
          <div
            className={`pointer-events-none absolute inset-0 z-25 transition-opacity duration-500 ${
              isHovered ? "opacity-20" : "opacity-0"
            }`}
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(246, 210, 92, 0.3) 3px, rgba(246, 210, 92, 0.3) 4px)",
            }}
          />

          {/* Bottom vignette for cinematic contrast */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-15 h-36 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Floating badge inside image: Experience tag */}
          <motion.div
            className="pointer-events-none absolute left-4 top-4 z-30 flex items-center gap-2 rounded-full border border-amber-300/40 bg-black/60 px-3.5 py-1.5 text-xs font-semibold text-amber-200 backdrop-blur-md"
            animate={reduced ? undefined : { y: [0, -3, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
            </span>
            <span>{experienceLabel}</span>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}
