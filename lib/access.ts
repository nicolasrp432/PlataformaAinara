/**
 * ─────────────────────────────────────────────────────────────────────────
 *  MODELO DE ACCESO — FUENTE ÚNICA DE VERDAD
 * ─────────────────────────────────────────────────────────────────────────
 *
 * La plataforma tiene tres niveles de acceso. El nivel NO se guarda: se
 * deriva siempre de `profiles.role` + `profiles.access_status`, de modo que
 * middleware, páginas de servidor y rutas de API no puedan discrepar.
 *
 *   free    → cuenta creada, sin suscripción activa.
 *             Navega el catálogo completo y ve la PRIMERA clase de cada
 *             formación. El resto aparece bloqueado con la invitación a
 *             suscribirse.
 *   member  → suscripción activa (`access_status = 'approved'`).
 *             Acceso total al contenido.
 *   staff   → `role` admin o mentor. Acceso total + panel de administración.
 *
 * `access_status = 'suspended'` es el único estado que retira el acceso
 * gratuito: corresponde a una suscripción impagada o a una cuenta bloqueada.
 *
 * IMPORTANTE: registrarse NO deja al usuario "en revisión". Un registro
 * nuevo entra directamente como `free` y puede usar la plataforma en el
 * mismo segundo. `approved` significa exclusivamente "ha pagado".
 */

export type AccessStatus = "pending" | "approved" | "suspended"
export type UserRole = "student" | "mentor" | "admin"
export type AccessTier = "free" | "member" | "suspended" | "staff"

/** Cuántas lecciones iniciales de cada formación son gratuitas. */
export const FREE_LESSONS_PER_FORMATION = 1

export function resolveAccessTier(
  role: string | null | undefined,
  accessStatus: string | null | undefined
): AccessTier {
  if (role === "admin" || role === "mentor") return "staff"
  if (accessStatus === "approved") return "member"
  if (accessStatus === "suspended") return "suspended"
  return "free"
}

/** ¿Tiene el contenido completo desbloqueado? */
export function hasFullAccess(tier: AccessTier): boolean {
  return tier === "member" || tier === "staff"
}

/** ¿Puede al menos entrar en la plataforma (aunque sea en modo gratuito)? */
export function canEnterPlatform(tier: AccessTier): boolean {
  return tier !== "suspended"
}

/**
 * Regla de desbloqueo de una lección. Es deliberadamente estructural: la
 * primera lección de la formación siempre es gratis aunque nadie haya
 * marcado el flag `is_free` en la base de datos. Así la promesa "prueba la
 * primera clase" se cumple en toda formación publicada, presente y futura,
 * sin depender de que alguien recuerde marcar una casilla en el admin.
 *
 * @param lessonIndex Índice de la lección dentro del temario aplanado
 *                    (módulos ordenados → lecciones ordenadas), base 0.
 */
export function isLessonUnlocked(params: {
  tier: AccessTier
  lessonIndex: number
  isFree?: boolean | null
}): boolean {
  const { tier, lessonIndex, isFree } = params
  if (hasFullAccess(tier)) return true
  if (tier === "suspended") return false
  return lessonIndex < FREE_LESSONS_PER_FORMATION || isFree === true
}

// ─────────────────────────────────────────────────────────────────────────
//  CLASIFICACIÓN DE RUTAS
// ─────────────────────────────────────────────────────────────────────────

export type RouteAccess = "public" | "authenticated" | "member" | "staff"

/** Sin sesión: landing y páginas de marketing/legales. */
const PUBLIC_EXACT = new Set([
  "/",
  "/re-conectate",
  "/evaluacion",
  "/herramientas",
])

const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth",
  "/privacy",
  "/terms",
  "/legal",
  "/cookies",
]

/**
 * Requiere sesión, no suscripción. Aquí vive la experiencia gratuita: el
 * catálogo se navega entero y las formaciones se abren; el candado se aplica
 * lección a lección, no de golpe en la puerta. Bloquear `/library` entero
 * dejaba al usuario recién registrado sin nada que ver y sin motivo para
 * pagar.
 */
const AUTHENTICATED_PREFIXES = [
  "/dashboard",
  "/profile",
  "/billing",
  "/logout",
  "/pending",
  "/reflexion",
  "/library",
  "/formations",
  "/learn",
]

/** Requiere suscripción activa. */
const MEMBER_PREFIXES = [
  "/quest",
  "/taberna",
  "/mentorship",
  "/messages",
  "/assistant",
  "/u",
]

const STAFF_PREFIXES = ["/admin"]

function matches(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  )
}

export function getRouteAccess(pathname: string): RouteAccess {
  if (PUBLIC_EXACT.has(pathname)) return "public"
  if (matches(pathname, PUBLIC_PREFIXES)) return "public"
  if (matches(pathname, STAFF_PREFIXES)) return "staff"
  if (matches(pathname, MEMBER_PREFIXES)) return "member"
  if (matches(pathname, AUTHENTICATED_PREFIXES)) return "authenticated"
  return "public"
}

/** Rutas de autenticación de las que hay que expulsar a quien ya tiene sesión. */
export function isAuthEntryRoute(pathname: string): boolean {
  return matches(pathname, ["/login", "/register"])
}

/**
 * Destino tras iniciar sesión o registrarse. Solo se aceptan rutas internas
 * para que un `?redirect=` manipulado no pueda enviar al usuario fuera del
 * dominio (open redirect).
 */
export function safeRedirectTarget(
  raw: string | null | undefined,
  fallback = "/dashboard"
): string {
  if (!raw) return fallback
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback
  return raw
}
