import assert from "node:assert/strict"
import {
  resolveAccessTier, hasFullAccess, canEnterPlatform, isLessonUnlocked,
  getRouteAccess, isAuthEntryRoute, safeRedirectTarget,
} from "../lib/access.ts"

let pass = 0
const t = (name: string, fn: () => void) => {
  try { fn(); pass++ } catch (e) { console.log("FAIL:", name, "\n  ", (e as Error).message); process.exitCode = 1 }
}

// ── Resolución de nivel ───────────────────────────────────────────────
t("registro nuevo (pending) = free", () =>
  assert.equal(resolveAccessTier("student", "pending"), "free"))
t("perfil ausente = free", () =>
  assert.equal(resolveAccessTier(null, null), "free"))
t("suscrito = member", () =>
  assert.equal(resolveAccessTier("student", "approved"), "member"))
t("suspendido = suspended", () =>
  assert.equal(resolveAccessTier("student", "suspended"), "suspended"))
t("admin = staff aunque esté pending", () =>
  assert.equal(resolveAccessTier("admin", "pending"), "staff"))
t("mentor = staff aunque esté suspended", () =>
  assert.equal(resolveAccessTier("mentor", "suspended"), "staff"))

t("solo member y staff tienen acceso completo", () => {
  assert.equal(hasFullAccess("free"), false)
  assert.equal(hasFullAccess("suspended"), false)
  assert.equal(hasFullAccess("member"), true)
  assert.equal(hasFullAccess("staff"), true)
})
t("solo suspended queda fuera de la plataforma", () => {
  assert.equal(canEnterPlatform("free"), true)
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
  ["/quest", "member"], ["/taberna", "member"], ["/mentorship", "member"],
  ["/messages", "member"], ["/messages/xyz", "member"],
  ["/assistant", "member"], ["/u/some-id", "member"],
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
