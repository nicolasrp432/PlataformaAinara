-- ============================================================================
-- 0016 — Soporte para el cumplimiento de protección de datos (RGPD)
-- ============================================================================
--
-- Dos cosas:
--   1. `deletion_requests`: deja constancia auditable de quién solicita la baja
--      y cuándo. Antes la baja solo marcaba el perfil como `suspended`, sin
--      registro, así que no había forma de saber si se cumplía el plazo legal.
--   2. Sello de aceptación de términos y privacidad en `profiles`. El formulario
--      de registro ya obliga a marcarlos, pero no se guardaba prueba de ello.
--
-- Idempotente: se puede ejecutar las veces que haga falta.
-- ============================================================================

BEGIN;

-- ── 1. PRUEBA DEL CONSENTIMIENTO ───────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.terms_accepted_at IS
  'Momento en que la usuaria aceptó los Términos y Condiciones (prueba del consentimiento).';
COMMENT ON COLUMN public.profiles.privacy_accepted_at IS
  'Momento en que la usuaria aceptó la Política de Privacidad.';

-- Las cuentas anteriores a esta migración aceptaron en el registro, pero sin
-- sello: se les asigna su fecha de alta como mejor aproximación disponible.
UPDATE public.profiles
   SET terms_accepted_at   = COALESCE(terms_accepted_at, created_at),
       privacy_accepted_at = COALESCE(privacy_accepted_at, created_at)
 WHERE terms_accepted_at IS NULL
    OR privacy_accepted_at IS NULL;

-- ── 2. SOLICITUDES DE ELIMINACIÓN ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.deletion_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason       TEXT CHECK (char_length(reason) <= 500),
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'completed', 'cancelled')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Plazo máximo de respuesta que fija la política de privacidad.
  due_at       TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  completed_at TIMESTAMPTZ,
  notes        TEXT
);

CREATE INDEX IF NOT EXISTS idx_deletion_requests_status
  ON public.deletion_requests (status, due_at);

CREATE INDEX IF NOT EXISTS idx_deletion_requests_user
  ON public.deletion_requests (user_id);

ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;

-- Cada usuaria ve y crea únicamente su propia solicitud.
DROP POLICY IF EXISTS "deletion_requests_select_own" ON public.deletion_requests;
CREATE POLICY "deletion_requests_select_own" ON public.deletion_requests
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "deletion_requests_insert_own" ON public.deletion_requests;
CREATE POLICY "deletion_requests_insert_own" ON public.deletion_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Los administradores las ven todas y las gestionan.
DROP POLICY IF EXISTS "deletion_requests_admin_all" ON public.deletion_requests;
CREATE POLICY "deletion_requests_admin_all" ON public.deletion_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
       WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

COMMIT;

-- ── Consulta útil para el día a día ────────────────────────────────────────
-- Bajas pendientes y días que quedan de plazo legal:
--
-- SELECT d.requested_at,
--        d.due_at::date - CURRENT_DATE AS dias_restantes,
--        p.email,
--        d.reason
--   FROM public.deletion_requests d
--   JOIN public.profiles p ON p.id = d.user_id
--  WHERE d.status = 'pending'
--  ORDER BY d.due_at;
