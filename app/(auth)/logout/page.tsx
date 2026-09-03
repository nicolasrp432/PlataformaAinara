import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

/**
 * `/logout` es un enlace normal en el sidebar y en la hoja móvil, así que se
 * conserva como ruta y se delega el trabajo real al route handler, que sí
 * puede cerrar la sesión y borrar las cookies httpOnly de caché.
 */
export default function LogoutPage() {
  redirect("/api/auth/logout")
}
