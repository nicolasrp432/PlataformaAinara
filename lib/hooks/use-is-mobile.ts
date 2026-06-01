"use client"

import * as React from "react"

/**
 * Devuelve `true` cuando el viewport es menor que `breakpoint` (por defecto el
 * breakpoint md de Tailwind, 768px). Seguro en SSR: devuelve `false` hasta que
 * el componente se monta en el cliente.
 *
 * Útil para alternar entre un Dialog/Dropdown (desktop) y un bottom Sheet (mobile).
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const onChange = () => setIsMobile(mql.matches)
    onChange()
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [breakpoint])

  return isMobile
}
