"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

/**
 * Avisa del resultado del pago al volver de Stripe y limpia el parámetro de
 * la URL, para que un refresco o un enlace compartido no vuelvan a lanzar el
 * mensaje.
 */
export function CheckoutResultToast() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const checkout = searchParams.get("checkout")
  const shown = React.useRef(false)

  React.useEffect(() => {
    if (!checkout || shown.current) return
    shown.current = true

    if (checkout === "success") {
      toast.success("¡Ya tienes acceso completo!", {
        description: "Todas las formaciones están desbloqueadas. Disfrútalas.",
        duration: 6000,
      })
    } else if (checkout === "canceled") {
      toast("Pago cancelado", {
        description: "No se ha cobrado nada. Puedes retomarlo cuando quieras.",
      })
    } else if (checkout === "pending") {
      toast("Estamos confirmando tu pago", {
        description:
          "Puede tardar unos segundos. Si en un minuto sigue igual, escríbenos.",
      })
    }

    // Quitar el parámetro sin añadir una entrada al historial.
    const params = new URLSearchParams(searchParams.toString())
    params.delete("checkout")
    const query = params.toString()
    router.replace(query ? `?${query}` : window.location.pathname, {
      scroll: false,
    })
  }, [checkout, router, searchParams])

  return null
}
