import assert from "node:assert/strict"
import {
  PLANS, formatPrice, formatPriceDisplay, planPrice, isPlanPurchasable,
  isPlanId, SINGLE_SESSION_PRICE,
} from "../lib/pricing.ts"

let pass = 0
const t = (n: string, f: () => void) => { try { f(); pass++ } catch (e) { console.log("FAIL:", n, (e as Error).message); process.exitCode = 1 } }

/**
 * El separador entre cifra y símbolo es un espacio DURO (U+00A0), no uno
 * normal. Es lo correcto: evita que «337,97» y «€» acaben en líneas
 * distintas. Se comprueba de forma explícita para que nadie lo «arregle»
 * pensando que es un error de codificación.
 */
const NBSP = " "

t("el pago único cuesta 337,97 € en formato español", () =>
  assert.equal(planPrice(PLANS.lifetime), `337,97${NBSP}€`))
t("separa cifra y símbolo con espacio duro, no normal", () => {
  const out = planPrice(PLANS.lifetime)!
  assert.ok(out.includes(NBSP), "debería llevar espacio duro")
  assert.ok(!out.includes(" "), "no debería llevar espacio normal")
})
t("coma decimal, como manda el español", () =>
  assert.equal(formatPrice(1234.5), `1234,50${NBSP}€`))
t("el escaparate quita los decimales de un precio redondo", () => {
  assert.equal(formatPriceDisplay(67), `67${NBSP}€`)
  assert.equal(formatPriceDisplay(337.97), `337,97${NBSP}€`)
})
t("el símbolo va detrás de la cifra", () =>
  assert.ok(planPrice(PLANS.lifetime)!.endsWith("€")))

t("el pago único es modo payment", () =>
  assert.equal(PLANS.lifetime.mode, "payment"))
t("la suscripción es modo subscription", () =>
  assert.equal(PLANS.membership.mode, "subscription"))

t("la suscripción cuesta 67 € y se muestra sin decimales sobrantes", () => {
  assert.equal(PLANS.membership.amount, 67)
  assert.equal(planPrice(PLANS.membership), `67${NBSP}€`)
  assert.equal(isPlanPurchasable(PLANS.membership), true)
})
t("el formato exacto sí conserva los dos decimales, para facturación", () =>
  assert.equal(formatPrice(67), `67,00${NBSP}€`))
t("la sesión suelta cuesta más que dos meses de suscripción", () => {
  // El argumento de venta de la landing depende de esta relación: si algún
  // día deja de ser cierta, el test avisa antes que un cliente.
  assert.ok(SINGLE_SESSION_PRICE > PLANS.membership.amount! * 2)
})
t("el pago único sí es comprable", () =>
  assert.equal(isPlanPurchasable(PLANS.lifetime), true))

t("cada plan apunta a su propia variable de entorno", () => {
  assert.notEqual(PLANS.lifetime.stripePriceIdEnv, PLANS.membership.stripePriceIdEnv)
})

t("isPlanId valida", () => {
  assert.equal(isPlanId("lifetime"), true)
  assert.equal(isPlanId("membership"), true)
  assert.equal(isPlanId("otro"), false)
  assert.equal(isPlanId(undefined), false)
})

console.log(`\n${pass} comprobaciones de precio superadas${process.exitCode ? " (con fallos)" : ", 0 fallos"}`)
