import assert from "node:assert/strict"
import {
  resolveAccessTier, hasFullAccess, hasIncludedMentoring, canEnterPlatform,
  isLessonUnlocked, getRouteAccess, tierMeetsRoute, isAuthEntryRoute,
  safeRedirectTarget,
} from "../lib/access.ts"

let pass = 0
const t = (name: string, fn: () => void) => {
  try { fn(); pass++ } catch (e) { console.log("FAIL:", name, "\n  ", (e as Error).message); process.exitCode = 1 }
}

// ── Resolución de nivel ───────────────────────────────────────────────
t("registro nuevo (pending) = free", () =>
  assert.equal(resolveAccessTier({ role: "student", accessStatus: "pending" }), "free"))
t("perfil ausente = free", () =>
  assert.equal(resolveAccessTier({}), "free"))
t("suscrito = member", () =>
  assert.equal(resolveAccessTier({ role: "student", accessStatus: "approved" }), "member"))
t("suspendido = suspended", () =>
  assert.equal(resolveAccessTier({ role: "student", accessStatus: "suspended" }), "suspended"))
t("admin = staff aunque esté pending", () =>
  assert.equal(resolveAccessTier({ role: "admin", accessStatus: "pending" }), "staff"))
t("mentor = staff aunque esté suspended", () =>
  assert.equal(resolveAccessTier({ role: "mentor", accessStatus: "suspended" }), "staff"))

// ── Pago único: lo comprado no se quita ───────────────────────────────
t("pago único sin suscripción = lifetime", () =>
  assert.equal(
    resolveAccessTier({ role: "student", accessStatus: "pending", hasLifetimeAccess: true }),
    "lifetime"
  ))
t("cancelar la suscripción NO retira el acceso de por vida", () =>
  assert.equal(
    resolveAccessTier({ role: "student", accessStatus: "suspended", hasLifetimeAccess: true }),
    "lifetime"
  ))
t("con pago único Y suscripción activa manda member", () =>
  assert.equal(
    resolveAccessTier({ role: "student", accessStatus: "approved", hasLifetimeAccess: true }),
    "member"
  ))
t("sin pago único, suspended sigue siendo suspended", () =>
  assert.equal(
    resolveAccessTier({ role: "student", accessStatus: "suspended", hasLifetimeAccess: false }),
    "suspended"
  ))

// ── Qué desbloquea cada nivel ─────────────────────────────────────────
t("acceso completo al contenido: lifetime, member y staff", () => {
  assert.equal(hasFullAccess("free"), false)
  assert.equal(hasFullAccess("suspended"), false)
  assert.equal(hasFullAccess("lifetime"), true)
  assert.equal(hasFullAccess("member"), true)
  assert.equal(hasFullAccess("staff"), true)
})
t("mentoría incluida SOLO con suscripción (o staff)", () => {
  assert.equal(hasIncludedMentoring("free"), false)
  assert.equal(hasIncludedMentoring("suspended"), false)
  // El pago único da el contenido, no las sesiones: las paga aparte.
  assert.equal(hasIncludedMentoring("lifetime"), false)
  assert.equal(hasIncludedMentoring("member"), true)
  assert.equal(hasIncludedMentoring("staff"), true)
})
t("solo suspended queda fuera de la plataforma", () => {
  assert.equal(canEnterPlatform("free"), true)
  assert.equal(canEnterPlatform("lifetime"), true)
  assert.equal(canEnterPlatform("member"), true)
  assert.equal(canEnterPlatform("staff"), true)
  assert.equal(canEnterPlatform("suspended"), false)
})

// ── Candado por lección ───────────────────────────────────────────────
t("free abre la lección 0 de cualquier formación", () =>
  assert.equal(isLessonUnlocked({ tier: "free", lessonIndex: 0, isFree: false }), true))
t("free NO abre la lección 1", () =>
  assert.equal(isLessonUnlocked({ tier: "free", lessonIndex: 1, isFree: false }), false))
t("free NO abre la lección 47", () =>
  assert.equal(isLessonUnlocked({ tier: "free", lessonIndex: 47, isFree: null }), false))
t("free abre cualquier lección marcada is_free", () =>
  assert.equal(isLessonUnlocked({ tier: "free", lessonIndex: 9, isFree: true }), true))
t("lifetime abre todas las lecciones", () => {
  for (const i of [0, 1, 47, 999]) {
    assert.equal(isLessonUnlocked({ tier: "lifetime", lessonIndex: i, isFree: false }), true)
  }
})
t("member abre todas", () => {
  for (const i of [0, 1, 99]) assert.equal(isLessonUnlocked({ tier: "member", lessonIndex: i, isFree: false }), true)
})
t("staff abre todas", () =>
  assert.equal(isLessonUnlocked({ tier: "staff", lessonIndex: 99, isFree: false }), true))
t("suspended no abre ni la primera ni una is_free", () => {
  assert.equal(isLessonUnlocked({ tier: "suspended", lessonIndex: 0, isFree: true }), false)
  assert.equal(isLessonUnlocked({ tier: "suspended", lessonIndex: 0, isFree: false }), false)
})

// ── Clasificación de rutas ────────────────────────────────────────────
const cases: Array<[string, string]> = [
  ["/", "public"], ["/login", "public"], ["/register", "public"],
  ["/auth/callback", "public"], ["/privacy", "public"], ["/terms", "public"],
  ["/forgot-password", "public"], ["/reset-password", "public"],
  ["/dashboard", "authenticated"], ["/library", "authenticated"],
  ["/formations/re-conectate", "authenticated"],
  ["/learn/re-conectate/abc-123", "authenticated"],
  ["/reflexion", "authenticated"], ["/billing", "authenticated"],
  ["/billing/success", "authenticated"], ["/profile/settings", "authenticated"],
  ["/pending", "authenticated"], ["/logout", "authenticated"],
  ["/quest", "content"], ["/taberna", "content"], ["/mentorship", "content"],
  ["/messages", "content"], ["/messages/xyz", "content"],
  ["/assistant", "content"], ["/u/some-id", "content"],
  ["/admin", "staff"], ["/admin/content/lessons", "staff"],
]
for (const [path, expected] of cases) {
  t(`ruta ${path} → ${expected}`, () => assert.equal(getRouteAccess(path), expected))
}

t("prefijos no coinciden por subcadena", () => {
  // "/university" no debe caer bajo "/u"
  assert.equal(getRouteAccess("/university"), "public")
  // "/libraryX" no debe caer bajo "/library"
  assert.equal(getRouteAccess("/libraryX"), "public")
})

// ── El nivel frente a la categoría de ruta ────────────────────────────
t("free entra en lo autenticado pero no en el contenido", () => {
  assert.equal(tierMeetsRoute("free", "authenticated"), true)
  assert.equal(tierMeetsRoute("free", "content"), false)
  assert.equal(tierMeetsRoute("free", "member"), false)
  assert.equal(tierMeetsRoute("free", "staff"), false)
})
t("lifetime entra en el contenido pero no en lo exclusivo de suscripción", () => {
  assert.equal(tierMeetsRoute("lifetime", "content"), true)
  assert.equal(tierMeetsRoute("lifetime", "member"), false)
  assert.equal(tierMeetsRoute("lifetime", "staff"), false)
})
t("member entra en contenido y en suscripción", () => {
  assert.equal(tierMeetsRoute("member", "content"), true)
  assert.equal(tierMeetsRoute("member", "member"), true)
  assert.equal(tierMeetsRoute("member", "staff"), false)
})
t("staff entra en todo", () => {
  for (const r of ["public", "authenticated", "content", "member", "staff"] as const) {
    assert.equal(tierMeetsRoute("staff", r), true)
  }
})
t("suspended no entra ni en lo autenticado", () =>
  assert.equal(tierMeetsRoute("suspended", "authenticated"), false))
t("cualquiera entra en lo público", () => {
  for (const tier of ["free", "lifetime", "member", "staff", "suspended"] as const) {
    assert.equal(tierMeetsRoute(tier, "public"), true)
  }
})

t("rutas de entrada de auth", () => {
  assert.equal(isAuthEntryRoute("/login"), true)
  assert.equal(isAuthEntryRoute("/register"), true)
  assert.equal(isAuthEntryRoute("/dashboard"), false)
})

// ── Open redirect ─────────────────────────────────────────────────────
t("redirect externo se descarta", () => {
  assert.equal(safeRedirectTarget("https://evil.example/x"), "/dashboard")
  assert.equal(safeRedirectTarget("//evil.example/x"), "/dashboard")
  assert.equal(safeRedirectTarget("javascript:alert(1)"), "/dashboard")
  assert.equal(safeRedirectTarget(null), "/dashboard")
  assert.equal(safeRedirectTarget(""), "/dashboard")
})
t("redirect interno se respeta", () =>
  assert.equal(safeRedirectTarget("/learn/x/y"), "/learn/x/y"))

console.log(`\n${pass} comprobaciones superadas${process.exitCode ? " (con fallos)" : ", 0 fallos"}`)
