"use client"

import { useEffect, useRef, useState, useCallback } from "react"

interface GoldMatrixGlitchProps {
  className?: string
  interactive?: boolean
  activeRadius?: number
  sliceIntensity?: number
  particleCount?: number
  glowColor?: string
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  alpha: number
  life: number
  maxLife: number
}

interface GlitchSlice {
  y: number
  height: number
  offset: number
  color: string
  duration: number
  startTime: number
}

const RUNES = "01✦✧⌘⟐◈☼▲ᛗᚱᛏᛋᛟ∞§79ΑΒΓΔΩ0101XYZ"

export function GoldMatrixGlitch({
  className = "",
  interactive = true,
  activeRadius = 220,
  sliceIntensity = 1,
  particleCount = 28,
  glowColor = "#F6D25C",
}: GoldMatrixGlitchProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const mousePos = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000, speed: 0 })
  const lastMouseTime = useRef(Date.now())
  const lastMousePos = useRef({ x: 0, y: 0 })
  const glitchBurst = useRef(0)
  const particles = useRef<Particle[]>([])
  const activeSlices = useRef<GlitchSlice[]>([])
  const animFrameId = useRef<number | null>(null)
  const isVisible = useRef(true)

  // Track pointer movements
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const currentX = e.clientX - rect.left
    const currentY = e.clientY - rect.top

    const now = Date.now()
    const dt = Math.max(1, now - lastMouseTime.current)
    const dx = currentX - lastMousePos.current.x
    const dy = currentY - lastMousePos.current.y
    const speed = Math.sqrt(dx * dx + dy * dy) / dt

    mousePos.current.targetX = currentX
    mousePos.current.targetY = currentY
    mousePos.current.speed = speed

    lastMousePos.current = { x: currentX, y: currentY }
    lastMouseTime.current = now

    // If rapid movement, trigger glitch burst
    if (speed > 0.45) {
      glitchBurst.current = Math.min(1.8, glitchBurst.current + speed * 0.4 * sliceIntensity)
      if (Math.random() < 0.35 * sliceIntensity) {
        activeSlices.current.push({
          y: Math.random() * rect.height,
          height: 4 + Math.random() * 24,
          offset: (Math.random() - 0.5) * 28 * sliceIntensity,
          color: Math.random() > 0.4 ? "#FFE885" : "#D4A017",
          duration: 120 + Math.random() * 180,
          startTime: now,
        })
      }
    }

    // Spawn golden stardust particles
    if (particles.current.length < particleCount) {
      particles.current.push({
        x: currentX + (Math.random() - 0.5) * 16,
        y: currentY + (Math.random() - 0.5) * 16,
        vx: (Math.random() - 0.5) * 1.8 + dx * 0.05,
        vy: (Math.random() - 0.5) * 1.8 + dy * 0.05 - 0.6,
        size: 1.2 + Math.random() * 2.2,
        alpha: 0.9,
        life: 0,
        maxLife: 35 + Math.random() * 30,
      })
    }
  }, [sliceIntensity, particleCount])

  const handlePointerEnter = useCallback(() => {
    setIsHovered(true)
    glitchBurst.current = 1.0
  }, [])

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false)
    mousePos.current.targetX = -1000
    mousePos.current.targetY = -1000
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    let width = 0
    let height = 0
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    let columns = 0
    const fontSize = 14
    let drops: { y: number; speed: number; chars: string[]; brightness: number }[] = []

    function resize() {
      if (!container || !canvas) return
      const rect = container.getBoundingClientRect()
      width = Math.floor(rect.width)
      height = Math.floor(rect.height)
      dpr = Math.min(window.devicePixelRatio || 1, 2)

      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      if (ctx) {
        ctx.scale(dpr, dpr)
      }

      columns = Math.max(1, Math.floor(width / (fontSize * 0.9)))
      drops = []
      for (let i = 0; i < columns; i++) {
        const charCount = 8 + Math.floor(Math.random() * 16)
        const chars: string[] = []
        for (let c = 0; c < charCount; c++) {
          chars.push(RUNES[Math.floor(Math.random() * RUNES.length)])
        }
        drops.push({
          y: Math.random() * -height,
          speed: 1.2 + Math.random() * 2.6,
          chars,
          brightness: 0.6 + Math.random() * 0.4,
        })
      }
    }

    resize()
    window.addEventListener("resize", resize)

    // Visibility observer to save battery when scrolled away
    const observer = new IntersectionObserver(([entry]) => {
      isVisible.current = entry.isIntersecting
    }, { threshold: 0.05 })
    observer.observe(container)

    let lastTime = performance.now()

    function render(currentTime: number) {
      if (!isVisible.current || !ctx) {
        animFrameId.current = requestAnimationFrame(render)
        return
      }

      const dt = Math.min((currentTime - lastTime) / 1000, 0.1)
      lastTime = currentTime

      // Smooth mouse lerp
      mousePos.current.x += (mousePos.current.targetX - mousePos.current.x) * 0.18
      mousePos.current.y += (mousePos.current.targetY - mousePos.current.y) * 0.18

      // Decay glitch burst
      glitchBurst.current = Math.max(0, glitchBurst.current - dt * 2.5)

      ctx.clearRect(0, 0, width, height)

      const mx = mousePos.current.x
      const my = mousePos.current.y
      const hasCursor = mx > -100 && my > -100

      // 1. Draw Matrix Rain
      ctx.font = `600 ${fontSize}px "Courier New", monospace`
      ctx.textAlign = "center"

      for (let i = 0; i < drops.length; i++) {
        const drop = drops[i]
        const colX = i * (fontSize * 0.9) + fontSize * 0.5
        drop.y += drop.speed * (1 + glitchBurst.current * 0.8)

        if (drop.y - drop.chars.length * fontSize > height) {
          drop.y = Math.random() * -60
          drop.speed = 1.2 + Math.random() * 2.6
          for (let c = 0; c < drop.chars.length; c++) {
            drop.chars[c] = RUNES[Math.floor(Math.random() * RUNES.length)]
          }
        }

        // Randomly mutate character
        if (Math.random() < 0.04 + glitchBurst.current * 0.08) {
          const randIdx = Math.floor(Math.random() * drop.chars.length)
          drop.chars[randIdx] = RUNES[Math.floor(Math.random() * RUNES.length)]
        }

        for (let j = 0; j < drop.chars.length; j++) {
          const charY = drop.y - j * fontSize
          if (charY < -fontSize || charY > height + fontSize) continue

          const dist = hasCursor ? Math.hypot(colX - mx, charY - my) : 9999
          const proximity = hasCursor ? Math.max(0, 1 - dist / activeRadius) : 0

          // Base ambient opacity vs cursor-boosted opacity
          let baseAlpha = 0.04
          if (hasCursor && proximity > 0) {
            // Near cursor: high visibility golden matrix code
            baseAlpha += Math.pow(proximity, 1.3) * 0.85
          } else if (isHovered) {
            baseAlpha = 0.12
          }

          if (baseAlpha <= 0.01) continue

          // Glitch displacement jitter for individual characters
          let drawX = colX
          let drawY = charY
          if (glitchBurst.current > 0.2 && Math.random() < 0.12 * glitchBurst.current) {
            drawX += (Math.random() - 0.5) * 12 * glitchBurst.current
            drawY += (Math.random() - 0.5) * 6 * glitchBurst.current
          }

          // Gold color palette based on character position in trail & cursor proximity
          if (j === 0) {
            // Head character: radiant electric white-gold
            ctx.fillStyle = `rgba(255, 253, 240, ${Math.min(1, baseAlpha * 1.4)})`
            ctx.shadowColor = glowColor
            ctx.shadowBlur = hasCursor && proximity > 0.2 ? 12 : 4
          } else if (j < 3) {
            // Upper trail: vivid bright gold
            ctx.fillStyle = `rgba(246, 210, 92, ${baseAlpha})`
            ctx.shadowColor = glowColor
            ctx.shadowBlur = 6
          } else if (j < 7) {
            // Mid trail: amber gold
            ctx.fillStyle = `rgba(232, 180, 60, ${baseAlpha * 0.8})`
            ctx.shadowBlur = 0
          } else {
            // Tail: deep antique gold fading out
            const tailFade = 1 - j / drop.chars.length
            ctx.fillStyle = `rgba(141, 104, 22, ${baseAlpha * tailFade * 0.6})`
            ctx.shadowBlur = 0
          }

          ctx.fillText(drop.chars[j], drawX, drawY)
        }
      }

      ctx.shadowBlur = 0

      // 2. Glitch Slices rendering
      const now = Date.now()
      activeSlices.current = activeSlices.current.filter((slice) => {
        const elapsed = now - slice.startTime
        if (elapsed > slice.duration) return false

        const progress = elapsed / slice.duration
        const alpha = (1 - progress) * 0.55 * sliceIntensity

        ctx.fillStyle = slice.color === "#FFE885"
          ? `rgba(255, 232, 133, ${alpha})`
          : `rgba(212, 160, 23, ${alpha})`
        
        ctx.fillRect(
          slice.offset > 0 ? slice.offset : 0,
          slice.y,
          width,
          slice.height
        )

        // Draw scanlines in glitch band
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.7})`
        ctx.fillRect(0, slice.y + slice.height * 0.5, width, 1.2)
        return true
      })

      // 3. Stardust particles following cursor
      particles.current = particles.current.filter((p) => {
        p.life += 1
        if (p.life >= p.maxLife) return false

        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.96
        p.vy *= 0.96
        p.alpha = Math.max(0, 1 - p.life / p.maxLife)

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * (1 - p.life / p.maxLife * 0.5), 0, Math.PI * 2)
        ctx.fillStyle = `rgba(246, 210, 92, ${p.alpha * 0.85})`
        ctx.shadowColor = "#FFE072"
        ctx.shadowBlur = 8
        ctx.fill()
        return true
      })
      ctx.shadowBlur = 0

      // 4. Cursor Golden Radial Light Aura
      if (hasCursor && isHovered) {
        const auraGrad = ctx.createRadialGradient(mx, my, 0, mx, my, activeRadius)
        auraGrad.addColorStop(0, "rgba(246, 210, 92, 0.28)")
        auraGrad.addColorStop(0.35, "rgba(232, 180, 60, 0.12)")
        auraGrad.addColorStop(0.7, "rgba(185, 133, 36, 0.04)")
        auraGrad.addColorStop(1, "rgba(0, 0, 0, 0)")

        ctx.fillStyle = auraGrad
        ctx.fillRect(0, 0, width, height)
      }

      animFrameId.current = requestAnimationFrame(render)
    }

    animFrameId.current = requestAnimationFrame(render)

    return () => {
      window.removeEventListener("resize", resize)
      observer.disconnect()
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current)
    }
  }, [glowColor, activeRadius, sliceIntensity, particleCount, isHovered])

  return (
    <div
      ref={containerRef}
      className={`pointer-events-auto absolute inset-0 z-20 overflow-hidden ${className}`}
      onPointerMove={interactive ? handlePointerMove : undefined}
      onPointerEnter={interactive ? handlePointerEnter : undefined}
      onPointerLeave={interactive ? handlePointerLeave : undefined}
      style={{ touchAction: "none" }}
    >
      <canvas
        ref={canvasRef}
        className="h-full w-full pointer-events-none select-none"
        style={{ mixBlendMode: "screen" }}
      />
    </div>
  )
}
