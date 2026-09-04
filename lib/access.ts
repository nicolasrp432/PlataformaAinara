/**
 * ─────────────────────────────────────────────────────────────────────────
 *  MODELO DE ACCESO — FUENTE ÚNICA DE VERDAD
 * ─────────────────────────────────────────────────────────────────────────
 *
 * El nivel NO se guarda: se deriva siempre de `profiles.role`,
 * `profiles.access_status` y `profiles.has_lifetime_access`, de modo que
 * middleware, páginas de servidor y rutas de API no puedan discrepar.
 *
 *   free      → cuenta creada, no ha comprado nada. Navega el catálogo
 *               entero y ve la PRIMERA clase de cada formación.
 *   lifetime  → ha pagado una vez. Toda la plataforma, para siempre.
 *   member    → suscripción activa. Todo lo anterior más talleres en
 *               directo y mentoría 1 a 1 incluida sin pagar por sesión.
 *   staff     → `role` admin o mentor.
 *   suspended → sin acceso.
 *
 * ── POR QUÉ SON DOS CAMPOS Y NO UN ENUM ──────────────────────────────────
 *
 * «Acceso de por vida» y «suscripción activa» son ortogonales: se puede
 * tener uno, el otro o los dos. Meterlos en el mismo campo obligaría a
 * sobrescribir un valor con el otro, y ahí está el peligro real: cuando el
 * webhook de Stripe marca `access_status = 'suspended'` al cancelarse una
 * suscripción, no puede llevarse por delante un acceso que la persona ya
 * pagó. Por eso `has_lifetime_access` es una columna aparte y, en
 * `resolveAccessTier`, gana a `suspended`.
 *
 * Dicho de otro modo: cancelar la suscripción te devuelve a `lifetime`,
 * nunca a `free` ni a `suspended`.
 *
 * IMPORTANTE: registrarse NO deja al usuario "en revisión". Un registro
 * nuevo entra directamente como `free` y puede usar la plataforma en el
 * mismo segundo.
 */

export type AccessStatus = "pending" | "approved" | "suspended"
export type UserRole = "student" | "mentor" | "admin"
export type AccessTier = "free" | "lifetime" | "member" | "suspended" | "staff"

/** Cuántas lecciones iniciales de cada formación son gratuitas. */
export const FREE_LESSONS_PER_FORMATION = 1

export interface AccessInput {
  role?: string | null
  /** Estado de la SUSCRIPCIÓN, no del acceso global. */
  accessStatus?: string | null
  /** Pago único realizado. Nunca caduca. */
  hasLifetimeAccess?: boolean | null
}

export function resolveAccessTier(input: AccessInput): AccessTier {
  const { role, accessStatus, hasLifetimeAccess } = input

  if (role === "admin" || role === "mentor") return "staff"

  // Suscripción activa: el nivel más alto de cliente.
  if (accessStatus === "approved") return "member"

  // Un pago único ya hecho sobrevive a que la suscripción se cancele o se
  // impague. Va ANTES de `suspended` a propósito: ver la nota de cabecera.
  if (hasLifetimeAccess === true) return "lifetime"

  if (accessStatus === "suspended") return "suspended"

  return "free"
}

/** ¿Tiene desbloqueado todo el contenido de las formaciones? */
export function hasFullAccess(tier: AccessTier): boolean {
  return tier === "lifetime" || tier === "member" || tier === "staff"
}

/**
 * ¿Tiene la mentoría 1 a 1 y los talleres incluidos?
 *
 * Es lo que compra la suscripción. Quien solo tiene el pago único puede
 * reservar igualmente, pero pagando la sesión aparte.
 */
export function hasIncludedMentoring(tier: AccessTier): boolean {
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

export type RouteAccess =
  | "public"
  | "authenticated"
  | "content"
  | "member"
  | "staff"

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
 * Requiere sesión, no compra. Aquí vive la experiencia gratuita: el catálogo
 * se navega entero y las formaciones se abren; el candado se aplica lección a
 * lección, no de golpe en la puerta. Bloquear `/library` entero dejaba al
 * usuario recién registrado sin nada que ver y sin motivo para pagar.
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

/**
 * Requiere haber comprado (pago único o suscripción). Es «la plataforma»
 * más allá del catálogo: comunidad, logros, mensajes, asistente y la
 * reserva de mentoría.
 *
 * `/mentorship` está aquí y no en `MEMBER_PREFIXES` a propósito: quien tiene
 * el pago único puede reservar una sesión, solo que la paga aparte. Es la
 * propia página la que decide si va incluida, con `hasIncludedMentoring`.
 */
const CONTENT_PREFIXES = [
  "/quest",
  "/taberna",
  "/mentorship",
  "/messages",
  "/assistant",
  "/u",
]

/**
 * Exclusivo de la suscripción. Vacío por ahora: lo que la suscripción añade
 * hoy (mentoría incluida) es una condición DENTRO de `/mentorship`, no una
 * sección aparte. Aquí entrarán los talleres en directo cuando existan.
 */
const MEMBER_PREFIXES: string[] = []

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
  if (matches(pathname, CONTENT_PREFIXES)) return "content"
  if (matches(pathname, AUTHENTICATED_PREFIXES)) return "authenticated"
  return "public"
}

/** ¿El nivel alcanza para entrar en una ruta de esa categoría? */
export function tierMeetsRoute(tier: AccessTier, route: RouteAccess): boolean {
  switch (route) {
    case "public":
      return true
    case "authenticated":
      return canEnterPlatform(tier)
    case "content":
      return hasFullAccess(tier)
    case "member":
      return hasIncludedMentoring(tier)
    case "staff":
      return tier === "staff"
  }
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
