"use client"

import * as React from "react"
import { Toaster } from "sonner"

/**
 * En escritorio los toasts viven abajo a la derecha. En móvil esa esquina la
 * ocupa la barra de navegación inferior, así que se mueven arriba.
 */
export function AppToaster() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  return (
    <Toaster
      richColors
      position={isMobile ? "top-center" : "bottom-right"}
      closeButton={isMobile}
    />
  )
}
