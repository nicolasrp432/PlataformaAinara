/**
 * ─────────────────────────────────────────────────────────────────────────
 *  PRECIOS — FUENTE ÚNICA
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  Mitra vende DOS cosas distintas:
 *
 *    1. `lifetime`   — pago único. Abre toda la plataforma para siempre.
 *    2. `membership` — suscripción. Añade talleres en directo y mentoría
 *                      1 a 1 incluida, que sin ella se paga por sesión.
 *
 *  Son independientes: se puede tener solo el pago único, solo la
 *  suscripción, o ambos. Ese matiz vive en `lib/access.ts`.
 *
 *  ⚠️  AVISO IMPORTANTE ⚠️
 *
 *  Lo que se define aquí es lo que el usuario LEE. Lo que de verdad se le
 *  COBRA lo decide el precio configurado en el panel de Stripe, al que
 *  apunta `stripePriceIdEnv`. Son dos cosas distintas y nada las mantiene
 *  sincronizadas automáticamente. Si no coinciden, la página está mintiendo:
 *
 *    · Importe: si aquí pone 337,97 € y el precio de Stripe cobra otra
 *      cantidad, el usuario ve un número y paga otro.
 *    · Modo: `mode` DEBE corresponderse con el tipo de precio en Stripe.
 *        "payment"      → precio one-time (pago único)
 *        "subscription" → precio recurrente
 *      El checkout deriva el modo de aquí, así que una discrepancia no solo
 *      engaña: rompe el pago, porque Stripe rechaza un precio recurrente en
 *      `mode: "payment"` y viceversa.
 *
 *  Antes de tocar un importe aquí, cámbialo en Stripe.
 */

export type PlanId = "lifetime" | "membership"
export type CheckoutMode = "payment" | "subscription"

export interface Plan {
  id: PlanId
  /** Nombre comercial, el que se lee en la página. */
  name: string
  /**
   * Importe en euros, o `null` cuando todavía no está decidido. Con `null`
   * la interfaz muestra la propuesta de valor SIN cifra: publicar un precio
   * inventado es un compromiso comercial, no un texto de relleno.
   */
  amount: number | null
  /** Modo de la sesión de Stripe. Debe casar con el tipo de precio allí. */
  mode: CheckoutMode
  /** Variable de entorno que guarda el id del precio en Stripe. */
  stripePriceIdEnv: string
  /** Coletilla bajo el importe. */
  billingNote: string
  /** Promesa en una línea. */
  tagline: string
}

export const PLANS: Record<PlanId, Plan> = {
  lifetime: {
    id: "lifetime",
    name: "Acceso completo",
    amount: 337.97,
    mode: "payment",
    stripePriceIdEnv: "STRIPE_PRICE_ID_LIFETIME",
    billingNote: "Pago único. Sin cuotas ni renovaciones.",
    tagline: "Toda la plataforma, tuya para siempre.",
  },
  membership: {
    id: "membership",
    name: "Acompañamiento",
    amount: 67,
    mode: "subscription",
    stripePriceIdEnv: "STRIPE_PRICE_ID_MEMBERSHIP",
    billingNote: "Al mes. Cancela cuando quieras.",
    tagline: "Todo lo anterior, más Ainara a tu lado cada mes.",
  },
}

/** El plan principal: es el que ancla el precio en la página. */
export const PRIMARY_PLAN = PLANS.lifetime

/**
 * Lo que cuesta una sesión de mentoría suelta, sin suscripción.
 *
 * Es el ancla honesta de la suscripción: 67 €/mes frente a 150 € por sesión.
 * Debe coincidir con `mentors.session_price` en la base de datos y con el
 * respaldo de `app/(platform)/mentorship/page.tsx`; si allí cambia, cambia
 * aquí, porque este número se publica en la página de venta.
 */
export const SINGLE_SESSION_PRICE = 150

const exactFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const displayFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/**
 * Importe exacto, siempre con dos decimales: «337,97 €», «67,00 €».
 * Para facturación y para cualquier sitio donde el céntimo importe.
 *
 * El separador entre cifra y símbolo es un espacio duro (U+00A0), cosa de
 * `Intl`: evita que el número y el «€» acaben en líneas distintas.
 */
export function formatPrice(amount: number): string {
  return exactFormatter.format(amount)
}

/**
 * Importe para escaparate: «337,97 €», pero «67 €» en vez de «67,00 €».
 * Un precio redondo arrastrando dos ceros se lee peor y no aporta nada.
 */
export function formatPriceDisplay(amount: number): string {
  return displayFormatter.format(amount)
}

/** El importe de un plan listo para mostrar, o `null` si aún no tiene precio. */
export function planPrice(plan: Plan): string | null {
  return plan.amount === null ? null : formatPriceDisplay(plan.amount)
}

/** ¿Se puede comprar ya, o solo recoger interés? */
export function isPlanPurchasable(plan: Plan): boolean {
  return plan.amount !== null
}

/**
 * Id del precio en Stripe para un plan. Se lee en tiempo de ejecución
 * (no en el módulo) para que un despliegue sin la variable falle con un
 * mensaje claro en lugar de arrastrar una cadena vacía hasta Stripe.
 *
 * `STRIPE_PRICE_ID` se acepta como respaldo del plan de por vida: es la
 * variable que ya existía cuando solo había un producto, y así un entorno
 * antiguo sigue funcionando sin tocar nada.
 */
export function stripePriceIdFor(plan: Plan): string {
  const value = process.env[plan.stripePriceIdEnv]
  if (value) return value
  if (plan.id === "lifetime") return process.env.STRIPE_PRICE_ID ?? ""
  return ""
}

export function isPlanId(value: unknown): value is PlanId {
  return value === "lifetime" || value === "membership"
}
