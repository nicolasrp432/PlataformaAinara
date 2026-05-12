-- ============================================================
-- SEED: Formación "RE-CONECTA" — Ainara Coaching
-- Ejecutar en Supabase SQL Editor
-- ============================================================
-- Estructura: 1 Formación → 7 Módulos (6 semanas + Bonos) → ~36 Lecciones
-- ============================================================

DO $$
DECLARE
  v_formation_id UUID;
  v_mod1_id      UUID;
  v_mod2_id      UUID;
  v_mod3_id      UUID;
  v_mod4_id      UUID;
  v_mod5_id      UUID;
  v_mod6_id      UUID;
  v_mod_bonus_id UUID;
BEGIN

-- ── 1. FORMACIÓN ────────────────────────────────────────────
INSERT INTO public.formations (
  title,
  slug,
  description,
  long_description,
  difficulty,
  duration_minutes,
  is_published,
  is_featured,
  is_premium,
  xp_reward,
  price,
  sort_order
) VALUES (
  'RE-CONECTA',
  're-conecta',
  'Reconecta contigo, silencia tu mente crítica y vuelve a sentirte suficiente.',
  'RE-CONECTA es un programa de transformación emocional diseñado para ayudar a mujeres que viven atrapadas en la autocrítica, la inseguridad, el agotamiento emocional y la desconexión consigo mismas. A través de herramientas de inteligencia emocional, neurociencia aplicada, mindfulness, PNL y prácticas de presencia consciente, esta formación guía paso a paso a la alumna para: silenciar su voz crítica, fortalecer su autoestima, sanar la relación consigo misma, volver a sentirse segura y auténtica, aprender a escucharse sin juicio y crear una nueva identidad emocional desde el amor propio.',
  'beginner',
  360,
  false,
  false,
  true,
  600,
  0.00,
  3
)
RETURNING id INTO v_formation_id;

RAISE NOTICE 'Formación creada: %', v_formation_id;

-- ── 2. MÓDULO 1: DESPIERTA TU CONSCIENCIA EMOCIONAL ─────────
INSERT INTO public.modules (
  formation_id, title, slug, description, sort_order, is_published
) VALUES (
  v_formation_id,
  'Módulo 1 — Despierta Tu Consciencia Emocional',
  'rc-mod1-consciencia-emocional',
  'Comprende por qué te hablas con dureza y cómo funciona la autocrítica interna.',
  1, false
)
RETURNING id INTO v_mod1_id;

INSERT INTO public.lessons (
  module_id, title, slug, description, content_type,
  sort_order, xp_reward, is_free, is_published, duration_seconds, resources
) VALUES
(v_mod1_id,
 'Qué es la Voz Crítica',
 'rc-m1-que-es-la-voz-critica',
 'Descubre qué es la voz crítica interna, cómo nace y por qué se activa en tu vida cotidiana.',
 'video', 1, 50, true, false, 0,
 '[{"title": "Mapa Emocional", "url": "", "type": "pdf"}]'::jsonb),

(v_mod1_id,
 'Cómo se Forma la Baja Autoestima',
 'rc-m1-como-se-forma-la-baja-autoestima',
 'Entiende el origen de la baja autoestima y los patrones que la sostienen en el tiempo.',
 'video', 2, 50, false, false, 0,
 '[]'::jsonb),

(v_mod1_id,
 'El Impacto del Diálogo Interno',
 'rc-m1-impacto-dialogo-interno',
 'Aprende cómo las palabras que te dices a ti misma moldean tu realidad emocional y tus decisiones.',
 'video', 3, 50, false, false, 0,
 '[]'::jsonb),

(v_mod1_id,
 'Sistema Nervioso y Emociones',
 'rc-m1-sistema-nervioso-emociones',
 'Comprende la conexión entre tu sistema nervioso y tus respuestas emocionales automáticas.',
 'video', 4, 50, false, false, 0,
 '[]'::jsonb),

(v_mod1_id,
 'Autoobservación Emocional',
 'rc-m1-autoobservacion-emocional',
 'Ejercicio práctico para comenzar a observarte sin juicio y detectar tus patrones emocionales.',
 'exercise', 5, 75, false, false, 0,
 '[{"title": "Diario Emocional Inicial", "url": "", "type": "pdf"},
   {"title": "Respira y Obsérvate", "url": "", "type": "audio"}]'::jsonb);

RAISE NOTICE 'Módulo 1 creado: %', v_mod1_id;

-- ── 3. MÓDULO 2: DESACTIVA LA AUTOCRÍTICA AUTOMÁTICA ────────
INSERT INTO public.modules (
  formation_id, title, slug, description, sort_order, is_published
) VALUES (
  v_formation_id,
  'Módulo 2 — Desactiva la Autocrítica Automática',
  'rc-mod2-desactiva-autocritica',
  'Interrumpe patrones mentales destructivos y crea nuevos circuitos neuronales de compasión.',
  2, false
)
RETURNING id INTO v_mod2_id;

INSERT INTO public.lessons (
  module_id, title, slug, description, content_type,
  sort_order, xp_reward, is_free, is_published, duration_seconds, resources
) VALUES
(v_mod2_id,
 'Neurociencia Emocional Aplicada',
 'rc-m2-neurociencia-emocional',
 'Aprende cómo el cerebro procesa las emociones y por qué los patrones críticos se automatizan.',
 'video', 1, 50, false, false, 0,
 '[]'::jsonb),

(v_mod2_id,
 'Técnicas para Interrumpir Pensamientos Críticos',
 'rc-m2-interrumpir-pensamientos-criticos',
 'Herramientas prácticas para detener el ciclo de pensamientos destructivos en el momento en que aparecen.',
 'video', 2, 50, false, false, 0,
 '[{"title": "Técnica STOP Emocional", "url": "", "type": "pdf"}]'::jsonb),

(v_mod2_id,
 'Regulación Emocional',
 'rc-m2-regulacion-emocional',
 'Aprende a activar estados de calma y serenidad desde tu sistema nervioso.',
 'video', 3, 50, false, false, 0,
 '[{"title": "Audio de Regulación Nerviosa", "url": "", "type": "audio"}]'::jsonb),

(v_mod2_id,
 'Reestructuración Interna',
 'rc-m2-reestructuracion-interna',
 'Técnicas para replantear situaciones y cambiar la interpretación emocional de los eventos.',
 'video', 4, 50, false, false, 0,
 '[]'::jsonb),

(v_mod2_id,
 'Reprogramación del Diálogo Interno',
 'rc-m2-reprogramacion-dialogo-interno',
 'Ejercicio de reencuadre mental: aprende a hablarle a tu mente crítica con compasión y firmeza.',
 'exercise', 5, 75, false, false, 0,
 '[{"title": "Plantilla Detecta Tu Diálogo Interno", "url": "", "type": "pdf"}]'::jsonb);

RAISE NOTICE 'Módulo 2 creado: %', v_mod2_id;

-- ── 4. MÓDULO 3: RECONECTA CON TU ESENCIA ───────────────────
INSERT INTO public.modules (
  formation_id, title, slug, description, sort_order, is_published
) VALUES (
  v_formation_id,
  'Módulo 3 — Reconecta con Tu Esencia',
  'rc-mod3-reconecta-esencia',
  'Vuelve al centro interior y aprende a escucharte desde la calma y la autenticidad.',
  3, false
)
RETURNING id INTO v_mod3_id;

INSERT INTO public.lessons (
  module_id, title, slug, description, content_type,
  sort_order, xp_reward, is_free, is_published, duration_seconds, resources
) VALUES
(v_mod3_id,
 'Qué Significa Reconectar con Tu Esencia',
 'rc-m3-que-es-reconectar',
 'Comprende qué es tu esencia, por qué te desconectaste de ella y cómo el camino de regreso comienza desde adentro.',
 'video', 1, 50, false, false, 0,
 '[]'::jsonb),

(v_mod3_id,
 'Regresa al Cuerpo',
 'rc-m3-regresa-al-cuerpo',
 'Aprende a usar el cuerpo como puerta de entrada a tus emociones reales y tu intuición profunda.',
 'video', 2, 50, false, false, 0,
 '[]'::jsonb),

(v_mod3_id,
 'Escucha Tu Verdad Interior',
 'rc-m3-escucha-verdad-interior',
 'Cómo distinguir la voz del miedo de la voz de tu intuición y aprender a confiar en tu interior.',
 'video', 3, 50, false, false, 0,
 '[]'::jsonb),

(v_mod3_id,
 'Identifica Tus Necesidades Reales',
 'rc-m3-necesidades-reales',
 'Ejercicio para descubrir qué necesitas realmente detrás de tus reacciones emocionales.',
 'exercise', 4, 75, false, false, 0,
 '[{"title": "Hoja de Journaling Consciente", "url": "", "type": "pdf"},
   {"title": "Ejercicio La Doble Pregunta", "url": "", "type": "pdf"}]'::jsonb),

(v_mod3_id,
 'Práctica Guiada — Vuelve a Tu Centro',
 'rc-m3-practica-vuelve-centro',
 'Meditación guiada de presencia consciente para volver a tu centro interior en cualquier momento.',
 'audio', 5, 75, false, false, 0,
 '[{"title": "Audio Meditativo Vuelve a Tu Centro", "url": "", "type": "audio"}]'::jsonb),

(v_mod3_id,
 'Ritual de Integración Emocional',
 'rc-m3-ritual-integracion',
 'Crea tu propio ritual personal de integración para cerrar cada día desde la presencia y la consciencia.',
 'exercise', 6, 75, false, false, 0,
 '[{"title": "PDF Ritual de Reconexión", "url": "", "type": "pdf"}]'::jsonb);

RAISE NOTICE 'Módulo 3 creado: %', v_mod3_id;

-- ── 5. MÓDULO 4: CONSTRUYE UNA NUEVA IDENTIDAD EMOCIONAL ────
INSERT INTO public.modules (
  formation_id, title, slug, description, sort_order, is_published
) VALUES (
  v_formation_id,
  'Módulo 4 — Construye una Nueva Identidad Emocional',
  'rc-mod4-nueva-identidad',
  'Deja atrás la identidad basada en inseguridad y empieza a construir una versión más segura y coherente.',
  4, false
)
RETURNING id INTO v_mod4_id;

INSERT INTO public.lessons (
  module_id, title, slug, description, content_type,
  sort_order, xp_reward, is_free, is_published, duration_seconds, resources
) VALUES
(v_mod4_id,
 'Identidad Emocional',
 'rc-m4-identidad-emocional',
 'Entiende qué es la identidad emocional y cómo defines inconscientemente quién eres a través de tus emociones.',
 'video', 1, 50, false, false, 0,
 '[]'::jsonb),

(v_mod4_id,
 'Cómo Cambiar Creencias Limitantes',
 'rc-m4-cambiar-creencias-limitantes',
 'Identifica y transforma las creencias que te mantienen atrapada en la inseguridad y la autocrítica.',
 'video', 2, 50, false, false, 0,
 '[{"title": "Ejercicio de Creencias", "url": "", "type": "pdf"}]'::jsonb),

(v_mod4_id,
 'Autoimagen Consciente',
 'rc-m4-autoimagen-consciente',
 'Trabaja la imagen que tienes de ti misma y aprende a verte desde la compasión y el reconocimiento.',
 'video', 3, 50, false, false, 0,
 '[]'::jsonb),

(v_mod4_id,
 'Reprogramación Interna',
 'rc-m4-reprogramacion-interna',
 'Visualización guiada para instalar una nueva versión interna más segura, auténtica y compasiva.',
 'audio', 4, 75, false, false, 0,
 '[{"title": "Visualización Guiada", "url": "", "type": "audio"}]'::jsonb),

(v_mod4_id,
 'Hábitos Emocionales',
 'rc-m4-habitos-emocionales',
 'Diseña hábitos emocionales diarios que sostengan y nutran tu nueva identidad en el tiempo.',
 'exercise', 5, 75, false, false, 0,
 '[{"title": "Plantilla Mi Nueva Identidad", "url": "", "type": "pdf"},
   {"title": "Ritual de Afirmaciones", "url": "", "type": "pdf"}]'::jsonb);

RAISE NOTICE 'Módulo 4 creado: %', v_mod4_id;

-- ── 6. MÓDULO 5: AUTOESTIMA EN LA VIDA REAL ─────────────────
INSERT INTO public.modules (
  formation_id, title, slug, description, sort_order, is_published
) VALUES (
  v_formation_id,
  'Módulo 5 — Autoestima en la Vida Real',
  'rc-mod5-autoestima-vida-real',
  'Aplica autoestima auténtica en relaciones, trabajo y vida diaria.',
  5, false
)
RETURNING id INTO v_mod5_id;

INSERT INTO public.lessons (
  module_id, title, slug, description, content_type,
  sort_order, xp_reward, is_free, is_published, duration_seconds, resources
) VALUES
(v_mod5_id,
 'Límites Emocionales',
 'rc-m5-limites-emocionales',
 'Aprende a establecer límites sanos desde el amor propio, sin culpa ni miedo al rechazo.',
 'video', 1, 50, false, false, 0,
 '[{"title": "Guía de Límites Saludables", "url": "", "type": "pdf"}]'::jsonb),

(v_mod5_id,
 'Comunicación Consciente',
 'rc-m5-comunicacion-consciente',
 'Herramientas para expresarte con autenticidad, claridad y sin perder tu centro emocional.',
 'video', 2, 50, false, false, 0,
 '[{"title": "Ejercicios de Comunicación", "url": "", "type": "pdf"}]'::jsonb),

(v_mod5_id,
 'Cómo Dejar de Agradar a Todos',
 'rc-m5-dejar-de-agradar',
 'Comprende el síndrome de la complacencia y aprende a priorizarte sin sentirte egoísta.',
 'video', 3, 50, false, false, 0,
 '[]'::jsonb),

(v_mod5_id,
 'Relaciones y Autoestima',
 'rc-m5-relaciones-autoestima',
 'Cómo tu nivel de autoestima define el tipo de relaciones que atraes y permites en tu vida.',
 'video', 4, 50, false, false, 0,
 '[]'::jsonb),

(v_mod5_id,
 'Autoestima y Energía Femenina',
 'rc-m5-autoestima-energia-femenina',
 'Conecta con tu energía femenina como fuente de poder, no de debilidad, y aplícala en tu autoestima diaria.',
 'video', 5, 75, false, false, 0,
 '[{"title": "Checklist de Autocuidado", "url": "", "type": "pdf"},
   {"title": "Prácticas de Autoestima Diaria", "url": "", "type": "pdf"}]'::jsonb);

RAISE NOTICE 'Módulo 5 creado: %', v_mod5_id;

-- ── 7. MÓDULO 6: INTEGRACIÓN Y EXPANSIÓN ────────────────────
INSERT INTO public.modules (
  formation_id, title, slug, description, sort_order, is_published
) VALUES (
  v_formation_id,
  'Módulo 6 — Integración y Expansión',
  'rc-mod6-integracion-expansion',
  'Consolida el cambio emocional y crea un plan de continuidad para sostener tu transformación.',
  6, false
)
RETURNING id INTO v_mod6_id;

INSERT INTO public.lessons (
  module_id, title, slug, description, content_type,
  sort_order, xp_reward, is_free, is_published, duration_seconds, resources
) VALUES
(v_mod6_id,
 'Cómo Sostener la Transformación',
 'rc-m6-sostener-transformacion',
 'Estrategias reales para mantener los cambios emocionales cuando la vida cotidiana intenta arrastrarte atrás.',
 'video', 1, 50, false, false, 0,
 '[]'::jsonb),

(v_mod6_id,
 'Qué Hacer Cuando Recaigas',
 'rc-m6-cuando-recaigas',
 'Aprende a volver a tu centro rápidamente después de un momento difícil, sin culparte ni abandonar el proceso.',
 'video', 2, 50, false, false, 0,
 '[]'::jsonb),

(v_mod6_id,
 'Hábitos de Bienestar Emocional',
 'rc-m6-habitos-bienestar',
 'Diseña tu ecosistema personal de bienestar emocional: hábitos, rituales y prácticas sostenibles.',
 'video', 3, 50, false, false, 0,
 '[]'::jsonb),

(v_mod6_id,
 'Plan de Crecimiento Personal',
 'rc-m6-plan-crecimiento',
 'Crea tu plan personal de integración de 30 días con metas emocionales claras y alcanzables.',
 'exercise', 4, 75, false, false, 0,
 '[{"title": "Plan de Integración 30 Días", "url": "", "type": "pdf"},
   {"title": "Carta al Yo Futuro", "url": "", "type": "pdf"}]'::jsonb),

(v_mod6_id,
 'Ritual de Cierre — Meditación Final',
 'rc-m6-ritual-cierre',
 'Meditación de cierre emocional para celebrar tu transformación y activar tu nueva versión.',
 'audio', 5, 100, false, false, 0,
 '[{"title": "Ritual de Cierre Emocional", "url": "", "type": "audio"}]'::jsonb);

RAISE NOTICE 'Módulo 6 creado: %', v_mod6_id;

-- ── 8. MÓDULO BONOS ─────────────────────────────────────────
INSERT INTO public.modules (
  formation_id, title, slug, description, sort_order, is_published
) VALUES (
  v_formation_id,
  'Bonos Exclusivos',
  'rc-mod-bonos',
  'Material adicional para potenciar tu proceso de transformación: meditaciones, plantillas y herramientas extra.',
  7, false
)
RETURNING id INTO v_mod_bonus_id;

INSERT INTO public.lessons (
  module_id, title, slug, description, content_type,
  sort_order, xp_reward, is_free, is_published, duration_seconds, resources
) VALUES
(v_mod_bonus_id,
 'BONUS 1 — 5 Ejercicios para Silenciar la Voz Crítica',
 'rc-bonus1-silenciar-voz-critica',
 'Mini curso: 5 ejercicios rápidos para silenciar tu voz crítica en menos de 5 minutos. Perfectos para momentos de crisis emocional.',
 'video', 1, 50, false, false, 0,
 '[]'::jsonb),

(v_mod_bonus_id,
 'BONUS 2 — Meditaciones Guiadas',
 'rc-bonus2-meditaciones-guiadas',
 'Pack de 4 meditaciones: Reconexión Interior, Calma Emocional, Seguridad Interna y Liberación de Ansiedad.',
 'audio', 2, 75, false, false, 0,
 '[{"title": "Reconexión Interior", "url": "", "type": "audio"},
   {"title": "Calma Emocional", "url": "", "type": "audio"},
   {"title": "Seguridad Interna", "url": "", "type": "audio"},
   {"title": "Liberación de Ansiedad", "url": "", "type": "audio"}]'::jsonb),

(v_mod_bonus_id,
 'BONUS 3 — Bitácora de Autoestima Diaria',
 'rc-bonus3-bitacora-autoestima',
 'Plantilla imprimible para registrar tu progreso emocional diario y fortalecer el hábito de la autoestima.',
 'exercise', 3, 50, false, false, 0,
 '[{"title": "Bitácora de Autoestima Diaria", "url": "", "type": "pdf"}]'::jsonb),

(v_mod_bonus_id,
 'BONUS 4 — 7 Días sin Autocrítica',
 'rc-bonus4-7-dias-sin-autocritica',
 'Checklist de 7 días para entrenar tu mente y reducir la autocrítica de forma progresiva y medible.',
 'exercise', 4, 50, false, false, 0,
 '[{"title": "Checklist 7 Días sin Autocrítica", "url": "", "type": "pdf"}]'::jsonb),

(v_mod_bonus_id,
 'BONUS 5 — Sesión Grupal Mensual en Vivo',
 'rc-bonus5-sesion-grupal',
 'Acceso al espacio grupal mensual en vivo con Ainara: resolución de bloqueos, acompañamiento emocional, preguntas y respuestas.',
 'video', 5, 100, false, false, 0,
 '[]'::jsonb);

RAISE NOTICE 'Módulo Bonos creado: %', v_mod_bonus_id;

-- ── RESUMEN ──────────────────────────────────────────────────
RAISE NOTICE '═══════════════════════════════════════════════════';
RAISE NOTICE 'RE-CONECTA insertada correctamente';
RAISE NOTICE 'formation_id:    %', v_formation_id;
RAISE NOTICE 'mod1 (Consciencia):     %', v_mod1_id;
RAISE NOTICE 'mod2 (Autocrítica):     %', v_mod2_id;
RAISE NOTICE 'mod3 (Esencia):         %', v_mod3_id;
RAISE NOTICE 'mod4 (Identidad):       %', v_mod4_id;
RAISE NOTICE 'mod5 (Vida Real):       %', v_mod5_id;
RAISE NOTICE 'mod6 (Integración):     %', v_mod6_id;
RAISE NOTICE 'mod7 (Bonos):           %', v_mod_bonus_id;
RAISE NOTICE '═══════════════════════════════════════════════════';
RAISE NOTICE 'Próximos pasos:';
RAISE NOTICE '1. Ve a /admin/content/formations y verifica RE-CONECTA';
RAISE NOTICE '2. Sube el thumbnail desde el panel admin';
RAISE NOTICE '3. Añade video_url / audio_url a cada lección desde /admin/content/lessons/{id}';
RAISE NOTICE '4. Sube los PDFs y audios a Supabase Storage y actualiza resources';
RAISE NOTICE '5. Publica lección por lección → módulo → formación';
RAISE NOTICE '═══════════════════════════════════════════════════';

END $$;


-- ============================================================
-- VERIFICACIÓN (ejecutar por separado tras el DO block)
-- ============================================================
-- SELECT f.title, COUNT(DISTINCT m.id) AS modulos, COUNT(DISTINCT l.id) AS lecciones
-- FROM formations f
-- JOIN modules m ON m.formation_id = f.id
-- JOIN lessons l ON l.module_id = m.id
-- WHERE f.slug = 're-conecta'
-- GROUP BY f.title;
-- Resultado esperado: RE-CONECTA | 7 | 36
