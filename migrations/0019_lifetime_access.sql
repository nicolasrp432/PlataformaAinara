-- =====================================================================
-- Migration 0019 — Acceso de por vida (pago único)
--
-- Mitra pasa a vender dos cosas distintas:
--
--   · Pago único (337,97 €) → acceso permanente a toda la plataforma.
--   · Suscripción           → añade talleres y mentoría 1 a 1 incluida.
--
-- Son independientes, así que necesitan campos independientes.
--
-- ── POR QUÉ UNA COLUMNA NUEVA Y NO UN VALOR MÁS EN access_status ──────
--
-- `access_status` describe el ciclo de vida de la SUSCRIPCIÓN, y el webhook
-- de Stripe lo sobrescribe solo: al cancelarse una suscripción lo pone en
-- 'suspended'. Si el acceso de por vida viviera en ese mismo campo, cancelar
-- la suscripción borraría un acceso que la persona ya pagó. Eso no es un bug
-- de datos: es quitarle a alguien algo que compró.
--
-- Con dos columnas, `resolveAccessTier` puede hacer que el pago único gane a
-- 'suspended', que es justo lo que debe ocurrir.
--
-- Idempotente.
-- =====================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_lifetime_access BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.profiles.has_lifetime_access IS
  'Pago único realizado: acceso permanente al contenido. Independiente de '
  'access_status (que describe la suscripción) y nunca se revoca por '
  'cancelación o impago de esta.';

-- Índice para las consultas del middleware, que filtran por nivel de acceso.
CREATE INDEX IF NOT EXISTS idx_profiles_lifetime_access
  ON public.profiles (has_lifetime_access)
  WHERE has_lifetime_access = TRUE;


-- ---------------------------------------------------------------------
-- Registro de pagos únicos
--
-- `subscriptions` no sirve para esto: un pago único no tiene periodo,
-- renovación ni estado que evolucione. Guardarlo ahí obligaría a dejar la
-- mitad de las columnas en NULL y a inventar un `status` que no existe.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.one_time_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  stripe_price_id TEXT,
  /** Importe realmente cobrado, en céntimos, tal y como lo reporta Stripe. */
  amount_total INTEGER,
  currency TEXT,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_one_time_purchases_user
  ON public.one_time_purchases (user_id);

ALTER TABLE public.one_time_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own purchases" ON public.one_time_purchases;
CREATE POLICY "Users can view own purchases"
  ON public.one_time_purchases FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access purchases" ON public.one_time_purchases;
CREATE POLICY "Service role full access purchases"
  ON public.one_time_purchases FOR ALL
  USING (auth.role() = 'service_role');


-- ---------------------------------------------------------------------
-- Migración de los clientes que ya existían
--
-- Antes de este cambio, `access_status = 'approved'` era la única forma de
-- tener acceso completo y se concedía con una suscripción. No se convierte
-- en acceso de por vida automáticamente: son productos distintos y regalar
-- el pago único a quien pagó una suscripción sería una decisión comercial,
-- no una migración de datos.
--
-- Si quieres concedérselo a alguien en concreto:
--
--   UPDATE public.profiles
--      SET has_lifetime_access = TRUE
--    WHERE email = 'persona@ejemplo.com';
-- ---------------------------------------------------------------------
