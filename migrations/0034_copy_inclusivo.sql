-- ============================================================================
-- 0034 — Copy inclusivo: el contenido deja de dirigirse solo a mujeres
-- ============================================================================
--
-- La plataforma se abre a público general. La interfaz ya estaba escrita en
-- segunda persona («vuelve a ti», «aprende a tu ritmo»), que en castellano no
-- marca género, así que el trabajo de código fue mínimo. Lo que sí excluía
-- estaba en el CONTENIDO, y el contenido vive en esta base de datos: cambiar
-- los ficheros de semilla no toca lo que ya está publicado. De ahí esta
-- migración.
--
-- Criterio de redacción: se neutraliza, no se masculiniza. Pasar «alumna» a
-- «alumno» cambiaría a quién excluye el texto, no lo arreglaría; la mayoría de
-- la comunidad actual son mujeres y el objetivo es sumar, no sustituir. Por eso
-- todo va a segunda persona o a fórmulas sin marca («personas», «quien»).
--
-- Las actualizaciones solo tocan la fila si el texto antiguo sigue ahí: si
-- alguien ya lo reescribió desde /admin, su versión se respeta. Es idempotente:
-- se puede ejecutar las veces que haga falta.
-- ============================================================================

BEGIN;

-- ── 1. RE-CONECTA ───────────────────────────────────────────────────────────
-- Era el texto más excluyente de la plataforma: «diseñado para ayudar a mujeres
-- que viven atrapadas […] guía paso a paso a la alumna». Un hombre que llegaba
-- a esa ficha leía, literalmente, que el programa no era para él.
--
-- La versión nueva, además de no marcar género, es mejor copy de venta: habla
-- en segunda persona desde el primer momento («te han ido alejando de ti») en
-- lugar de describir en tercera a un tipo de clienta.

UPDATE public.formations
   SET description = 'RE-CONECTA es un programa de transformación emocional para cuando la autocrítica, la inseguridad y el agotamiento te han ido alejando de ti. Con herramientas de inteligencia emocional, neurociencia aplicada, mindfulness, PNL y prácticas de presencia consciente, te guía paso a paso para silenciar tu voz crítica, fortalecer tu autoestima, sanar la relación contigo, recuperar la seguridad y la autenticidad, aprender a escucharte sin juicio y construir una nueva identidad emocional desde el amor propio.'
 WHERE slug = 're-conecta'
   AND description LIKE '%mujeres que viven atrapadas%';

-- ── 2. Lección de energía femenina ──────────────────────────────────────────
-- El término se mantiene a propósito: es vocabulario del método, no una señal
-- de público. En «Leyes Universales» la energía femenina y la masculina se
-- equilibran dentro de la misma persona, así que el concepto ya era universal;
-- lo que faltaba era decirlo en la ficha, para que quien no sea mujer no la
-- descarte al leer el título.

UPDATE public.lessons
   SET description = 'Tu energía femenina —sentir, recibir, fluir— como fuente de poder y no de debilidad. La tenemos todas las personas: aquí la llevas a tu autoestima diaria.'
 WHERE slug = 'rc-m5-autoestima-energia-femenina'
   AND description LIKE '%Conecta con tu energía femenina como fuente de poder%';

-- ── 2b. Participios y pronombres en femenino dirigidos a quien lee ──────────
-- Estas tres fichas tuteaban en femenino («te dices a ti misma», «te mantienen
-- atrapada», «la imagen que tienes de ti misma»). Son el caso más silencioso:
-- no dicen «para mujeres» en ningún sitio, pero cualquier hombre que las lea
-- nota que el texto no le habla. En dos de ellas la marca desaparece sola al
-- quitar un complemento que no aportaba nada.

UPDATE public.lessons
   SET description = 'Aprende cómo las palabras que te dices a diario moldean tu realidad emocional y tus decisiones.'
 WHERE slug = 'rc-m1-impacto-dialogo-interno'
   AND description LIKE '%te dices a ti misma%';

UPDATE public.lessons
   SET description = 'Identifica y transforma las creencias que te atan a la inseguridad y la autocrítica.'
 WHERE slug = 'rc-m4-cambiar-creencias-limitantes'
   AND description LIKE '%te mantienen atrapada%';

UPDATE public.lessons
   SET description = 'Trabaja la imagen que tienes de ti y aprende a mirarte desde la compasión y el reconocimiento.'
 WHERE slug = 'rc-m4-autoimagen-consciente'
   AND description LIKE '%imagen que tienes de ti misma%';

-- ── 3. Mensaje de bienvenida ────────────────────────────────────────────────
-- Quedaba el masculino genérico: la 0012 cambió «Sendero» por «Mitra» pero
-- dejó el «Bienvenido» intacto. De ahí que la condición mire por el saludo y no
-- por la marca. Editable desde /admin/settings.

UPDATE public.platform_settings
   SET value = 'Te damos la bienvenida a Mitra, tu espacio de crecimiento personal.',
       updated_at = now()
 WHERE key = 'welcome_message'
   AND value LIKE 'Bienvenido a %';

-- ── 4. Comentarios de columna ───────────────────────────────────────────────
-- Cosmético, pero estos comentarios los lee quien trabaje con la base de datos.

COMMENT ON COLUMN public.profiles.terms_accepted_at IS
  'Momento en que la persona usuaria aceptó los Términos y Condiciones (prueba del consentimiento).';
COMMENT ON COLUMN public.profiles.privacy_accepted_at IS
  'Momento en que la persona usuaria aceptó la Política de Privacidad.';

COMMIT;

-- ── Comprobación ────────────────────────────────────────────────────────────
-- Debe devolver 0 filas:
--
-- SELECT 'formación' AS donde, slug FROM public.formations
--  WHERE description ILIKE '%mujeres%' OR description ILIKE '%la alumna%'
-- UNION ALL
-- SELECT 'lección', slug FROM public.lessons
--  WHERE description ILIKE '%a ti misma%' OR description ILIKE '%atrapada%'
--     OR description ILIKE '%de ti misma%'
-- UNION ALL
-- SELECT 'ajuste', key FROM public.platform_settings
--  WHERE value ILIKE '%Sendero%' OR value ILIKE 'Bienvenido a %';
