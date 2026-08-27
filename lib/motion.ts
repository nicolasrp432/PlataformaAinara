/**
 * Tokens de movimiento — skill apple-design §4, §5, §6.
 *
 * Apple sustituyó deliberadamente el triplete físico (masa/rigidez/
 * amortiguación) por dos parámetros con los que sí se puede razonar:
 *
 *   · damping ratio → cuánto se pasa de largo. 1.0 = crítico, sin rebote.
 *   · response      → cuánto tarda en llegar al objetivo, en segundos.
 *                     No es "duración": un muelle no tiene duración fija.
 *
 * La API `bounce` + `duration` de Framer Motion mapea sobre esos dos.
 * `bounce: 0` equivale a damping 1.0.
 *
 * REGLA: rebote sólo cuando el gesto traía momento (un flick, un
 * arrastre soltado). Un tap y un hover no tienen momento, así que
 * van críticamente amortiguados.
 */

import type { Transition } from "framer-motion"

/** Por defecto para UI: reposicionar, indicadores, layout. Sin rebote. */
export const SPRING_UI: Transition = {
  type: "spring",
  bounce: 0,
  duration: 0.4,
}

/** Elementos pequeños que deben sentirse inmediatos (chips, badges). */
export const SPRING_SNAPPY: Transition = {
  type: "spring",
  bounce: 0,
  duration: 0.3,
}

/** Sheets y drawers. Apple: damping 0.8 / response 0.3. */
export const SPRING_SHEET: Transition = {
  type: "spring",
  bounce: 0.18,
  duration: 0.35,
}

/** Sólo tras un gesto con momento: soltar un arrastre, un flick. */
export const SPRING_MOMENTUM: Transition = {
  type: "spring",
  bounce: 0.2,
  duration: 0.4,
}

/** Fundido puro, para cuando el usuario pide movimiento reducido. */
export const FADE: Transition = { duration: 0.15, ease: "easeOut" }

/**
 * Proyección de momento — §6.
 *
 * Dónde acabaría el dedo si lo dejáramos decelerar solo. Es la función
 * exacta del código de ejemplo de "Designing Fluid Interfaces", no la
 * fórmula de libro de texto v²/(2a): Apple usa decaimiento exponencial.
 *
 * @param velocity px/s en el momento de soltar
 * @param decelerationRate 0.998 ≈ scroll normal · 0.99 ≈ más seco
 */
export function projectMomentum(velocity: number, decelerationRate = 0.998) {
  return (velocity / 1000) * decelerationRate / (1 - decelerationRate)
}

/**
 * Rubber-banding — §9. Cuanto más te pasas del límite, menos te sigue
 * el elemento. Un tope duro se lee como "congelado"; la resistencia
 * progresiva se lee como "responde, pero aquí no hay más".
 */
export function rubberband(overshoot: number, dimension: number, constant = 0.55) {
  return (
    (overshoot * dimension * constant) /
    (dimension + constant * Math.abs(overshoot))
  )
}

/** Elige el punto de anclaje más cercano a un valor proyectado. */
export function nearestSnapPoint(value: number, points: number[]) {
  return points.reduce((best, p) =>
    Math.abs(p - value) < Math.abs(best - value) ? p : best
  )
}
