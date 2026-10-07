"use client"

import Image from "next/image"
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion"
import { useState, type PointerEvent } from "react"
import { GoldMatrixGlitch } from "./gold-matrix-glitch"

export function HeroVisual() {
  const reduced = useReducedMotion()
  const [isHovered, setIsHovered] = useState(false)
  
  // High-spring 3D tilt tracking
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springConfig = { stiffness: 120, damping: 20 }
  const x = useSpring(mouseX, springConfig)
  const y = useSpring(mouseY, springConfig)

  const rotateX = useTransform(y, [-15, 15], [7, -7])
  const rotateY = useTransform(x, [-15, 15], [-7, 7])

  function respondToPointer(event: PointerEvent<HTMLElement>) {
    if (reduced || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const px = (event.clientX - bounds.left) / bounds.width - 0.5
    const py = (event.clientY - bounds.top) / bounds.height - 0.5
    mouseX.set(px * 24)
    mouseY.set(py * 24)
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
    <motion.figure
      className="ainara-hero-art group relative cursor-crosshair select-none"
      aria-label="Una semilla germinando con raíces visibles, símbolo de empezar desde la raíz"
      onPointerMove={respondToPointer}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={resetPointer}
      initial={reduced ? false : { opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 1200 }}
    >
      {/* Background ambient golden aura */}
      <motion.div
        className="pointer-events-none absolute -inset-6 -z-10 rounded-full bg-gradient-to-tr from-amber-500/20 via-primary/30 to-amber-200/10 blur-3xl"
        animate={
          reduced
            ? undefined
            : {
                scale: isHovered ? [1, 1.12, 1] : [1, 1.05, 1],
                opacity: isHovered ? 0.85 : 0.5,
              }
        }
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="hero-visual-image relative overflow-hidden rounded-3xl"
        style={{
          x,
          y,
          rotateX: reduced ? 0 : rotateX,
          rotateY: reduced ? 0 : rotateY,
          transformStyle: "preserve-3d",
        }}
        animate={
          reduced
            ? undefined
            : {
                translateY: isHovered ? [0, -6, 0] : [0, -4, 0],
              }
        }
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        {/* Base Seedling Image */}
        <div className="relative z-10 w-full">
          <Image
            src="/mitra-seedling.png"
            alt=""
            width={600}
            height={720}
            priority
            sizes="(max-width: 767px) 82vw, (max-width: 1279px) 42vw, 500px"
            className="h-auto w-full transition-all duration-300 group-hover:scale-[1.01]"
          />

          {/* Glitch chromatic split layer (triggered on hover) */}
          <div
            className={`pointer-events-none absolute inset-0 z-15 mix-blend-color-dodge transition-opacity duration-300 ${
              isHovered ? "opacity-60" : "opacity-0"
            }`}
            style={{
              backgroundImage: "url(/mitra-seedling.png)",
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              filter: "sepia(100%) hue-rotate(5deg) saturate(280%) contrast(120%)",
              transform: isHovered ? "translateX(2px)" : "none",
            }}
          />
        </div>

        {/* Matrix Gold Glitch Canvas Overlay */}
        <GoldMatrixGlitch
          className="z-20 rounded-3xl"
          activeRadius={240}
          sliceIntensity={1.2}
          particleCount={32}
          glowColor="#F6D25C"
        />

        {/* Micro scanline grid for cyber-organic matrix feel */}
        <div
          className={`pointer-events-none absolute inset-0 z-25 transition-opacity duration-500 ${
            isHovered ? "opacity-25" : "opacity-10"
          }`}
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(246, 210, 92, 0.25) 3px, rgba(246, 210, 92, 0.25) 4px)",
          }}
        />
      </motion.div>

      {/* Orbiting Golden Celestial Particles */}
      <motion.span
        className="hero-particle hero-particle-one"
        aria-hidden="true"
        animate={
          reduced
            ? undefined
            : {
                y: [0, -10, 0],
                x: [0, 4, 0],
                opacity: [0.4, 0.9, 0.4],
                scale: [1, 1.25, 1],
              }
        }
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        className="hero-particle hero-particle-two"
        aria-hidden="true"
        animate={
          reduced
            ? undefined
            : {
                y: [0, 8, 0],
                x: [0, -5, 0],
                opacity: [0.35, 0.85, 0.35],
                scale: [1, 1.2, 1],
              }
        }
        transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
      />

      {/* Additional sparkling golden particle */}
      <motion.span
        className="pointer-events-none absolute bottom-1/4 left-1/5 h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_12px_#F6D25C]"
        aria-hidden="true"
        animate={
          reduced
            ? undefined
            : {
                y: [0, -14, 0],
                opacity: [0.2, 0.8, 0.2],
                scale: [0.8, 1.4, 0.8],
              }
        }
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: 1.4 }}
      />
    </motion.figure>
  )
}
