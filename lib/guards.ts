import { redirect } from "next/navigation"
import { getAuthUser, getAccessTier } from "@/lib/data-access"
import { hasFullAccess, canEnterPlatform } from "@/lib/access"

/**
 * Guardas de servidor para páginas.
 *
 * El middleware ya protege estas rutas, pero es una única capa y depende de
 * que su `matcher` siga cubriendo la ruta: basta un cambio en la
 * configuración para dejar una sección abierta sin que nada falle de forma
 * visible. Estas comprobaciones viven junto a la página que protegen, así que
 * se mueven con ella.
 *
 * Van deduplicadas por `React.cache`, de modo que llamarlas no añade ninguna
 * consulta si el layout ya resolvió el nivel de acceso en este request.
 */

/** Exige sesión. Devuelve el usuario. */
export async function requireUser(redirectTo?: string) {
  const user = await getAuthUser()
  if (!user) {
    const target = redirectTo
      ? `/login?redirect=${encodeURIComponent(redirectTo)}`
      : "/login"
    redirect(target)
  }
  return user
}

/** Exige sesión + suscripción activa (o rol de staff). */
export async function requireMembership(from: string) {
  const user = await requireUser(from)
  const tier = await getAccessTier(user.id)

  if (!canEnterPlatform(tier)) redirect("/pending")

  if (!hasFullAccess(tier)) {
    redirect(`/billing?reason=subscription&from=${encodeURIComponent(from)}`)
  }

  return user
}
