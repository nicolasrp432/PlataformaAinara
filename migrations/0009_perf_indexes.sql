-- ─────────────────────────────────────────────────────────────────────────────
-- 0009 · Rendimiento multiusuario + idempotencia de webhooks
--
-- Aditiva y segura de reaplicar (IF NOT EXISTS). No modifica datos ni esquema
-- existente. Objetivo: soportar varios usuarios concurrentes sin degradar.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) Índices en FOREIGN KEYS que hoy NO los tienen.
--    Alimentan los JOINs y, sobre todo, las subqueries EXISTS de las políticas
--    RLS de modules/lessons (modules_select_enrolled, lessons_select_enrolled),
--    que se evalúan por-fila. Sin estos índices = Seq Scan por fila al escalar.

CREATE INDEX IF NOT EXISTS idx_modules_formation_id
  ON public.modules (formation_id);

CREATE INDEX IF NOT EXISTS idx_lessons_module_id
  ON public.lessons (module_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_formation_id
  ON public.enrollments (formation_id);

CREATE INDEX IF NOT EXISTS idx_reflection_reactions_user_id
  ON public.reflection_reactions (user_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id
  ON public.messages (sender_id);

-- 2) Índice compuesto para el overlay de progreso por-usuario
--    (filtro frecuente: user_id + is_completed, con .in(lesson_id, ...)).
CREATE INDEX IF NOT EXISTS idx_user_progress_user_completed
  ON public.user_progress (user_id, is_completed);

-- 3) Idempotencia del webhook de Stripe.
--    El handler inserta event.id; un reenvío de Stripe choca contra la PK (23505)
--    y se ignora. El código es defensivo: si esta tabla no existe todavía,
--    procesa como antes (sin idempotencia).
CREATE TABLE IF NOT EXISTS public.stripe_processed_events (
  event_id     text PRIMARY KEY,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- Solo el service-role (webhook) escribe aquí. RLS activado sin políticas =
-- ningún acceso desde clientes anon/auth; el service-role bypassa RLS.
ALTER TABLE public.stripe_processed_events ENABLE ROW LEVEL SECURITY;
