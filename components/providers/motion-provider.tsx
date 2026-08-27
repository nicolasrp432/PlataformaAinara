"use client"

import { MotionConfig } from "framer-motion"

/**
 * `reducedMotion="user"` hace que todos los componentes de Framer Motion
 * respeten `prefers-reduced-motion` del sistema: las transformaciones se
 * desactivan y sólo se anima la opacidad.
 *
 * El CSS de globals.css no puede alcanzar a Framer (anima con estilos
 * inline vía JS), así que esta pieza es imprescindible, no redundante.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
