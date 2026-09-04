import { redirect } from "next/navigation"
import { getAuthUser, getAccessTier } from "@/lib/data-access"
import { hasFullAccess, hasIncludedMentoring, canEnterPlatform } from "@/lib/access"

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

/**
 * Exige haber comprado: pago único o suscripción (o rol de staff).
 *
 * Es el listón de «la plataforma»: comunidad, logros, asistente y la reserva
 * de mentoría. NO exige suscripción, porque quien pagó una vez compró el
 * acceso completo al contenido.
 */
export async function requireContentAccess(from: string) {
  const user = await requireUser(from)
  const tier = await getAccessTier(user.id)

  if (!canEnterPlatform(tier)) redirect("/pending")

  if (!hasFullAccess(tier)) {
    redirect(`/billing?reason=access&from=${encodeURIComponent(from)}`)
  }

  return user
}

/**
 * Exige suscripción activa. Reservado para lo que la suscripción añade por
 * encima del pago único: los talleres en directo cuando existan.
 *
 * Ojo: la mentoría NO usa esta guarda. Su página es accesible para quien
 * tiene el pago único; lo que cambia según el nivel es si la sesión va
 * incluida o se paga aparte.
 */
export async function requireMembership(from: string) {
  const user = await requireContentAccess(from)
  const tier = await getAccessTier(user.id)

  if (!hasIncludedMentoring(tier)) {
    redirect(`/billing?reason=membership&from=${encodeURIComponent(from)}`)
  }

  return user
}
