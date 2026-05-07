-- ============================================================
-- SEED: Formación "Leyes Universales y Regulación Emocional"
-- Ejecutar en Supabase SQL Editor (o psql como superuser)
-- ============================================================
-- Estructura: 1 Formación → 1 Módulo → 8 Lecciones
-- Uso de CTEs con RETURNING para encadenar IDs automáticamente
-- ============================================================

DO $$
DECLARE
  v_formation_id UUID;
  v_module_id    UUID;
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
  'Leyes Universales y Regulación Emocional',
  'leyes-universales-regulacion-emocional',
  'Deja de luchar contra tus emociones y aprende la arquitectura mental para crear una vida alineada, estructurada y en paz.',
  'Un sistema terapéutico, estructurado y profundo que integra las 7 Leyes Herméticas con psicología evolutiva y regulación emocional. Sin espiritualidad exagerada ni promesas milagro — solo herramientas reales para transformar tu arquitectura mental y crear una vida en coherencia.',
  'intermediate',
  240,
  false,
  false,
  true,
  500,
  0.00,
  1
)
RETURNING id INTO v_formation_id;

RAISE NOTICE 'Formación creada: %', v_formation_id;

-- ── 2. MÓDULO ───────────────────────────────────────────────
INSERT INTO public.modules (
  formation_id,
  title,
  slug,
  description,
  sort_order,
  is_published
) VALUES (
  v_formation_id,
  'Leyes Universales y Regulación Emocional',
  'leyes-universales-regulacion-emocional',
  'El sistema completo de 8 leyes para transformar tu arquitectura mental y gestionar tus emociones desde la raíz.',
  1,
  false
)
RETURNING id INTO v_module_id;

RAISE NOTICE 'Módulo creado: %', v_module_id;

-- ── 3. LECCIONES ────────────────────────────────────────────

-- Lección 1 — Ley del Mentalismo
INSERT INTO public.lessons (
  module_id, title, slug, description, content_type,
  sort_order, xp_reward, is_free, is_published, duration_seconds,
  resources
) VALUES (
  v_module_id,
  'Ley del Mentalismo: El Origen de la Experiencia',
  'ley-del-mentalismo-el-origen-de-la-experiencia',
  'La mente no es un receptor pasivo, es la matriz de toda tu experiencia. Descubrirás la diferencia fundamental entre el Espíritu (Mente Consciente / Lo que "quieres") y el Alma (Mente Inconsciente / Lo que "vienes a aprender"), y por qué el conflicto nace cuando acumulas energías prestadas que no resuenan con tu propósito.',
  'video',
  1, 50, true, false, 0,
  '[{"title": "Auditoría Mental", "url": "", "type": "pdf"}]'::jsonb
);

-- Lección 2 — El Mapa de Tu Energía
INSERT INTO public.lessons (
  module_id, title, slug, description, content_type,
  sort_order, xp_reward, is_free, is_published, duration_seconds,
  resources
) VALUES (
  v_module_id,
  'El Mapa de Tu Energía: Los Arquetipos',
  'el-mapa-de-tu-energia-los-arquetipos',
  'Aterriza la teoría mental en tu identidad. Usaremos los 12 Arquetipos Zodiacales no como horóscopo, sino como psicología evolutiva. Entenderás el concepto del Héroe y por qué la vida te rompe para obligarte a soltar la energía adquirida y sacar la verdadera.',
  'video',
  2, 50, false, false, 0,
  '[]'::jsonb
);

-- Lección 3 — Ley de la Correspondencia
INSERT INTO public.lessons (
  module_id, title, slug, description, content_type,
  sort_order, xp_reward, is_free, is_published, duration_seconds,
  resources
) VALUES (
  v_module_id,
  'Ley de la Correspondencia: El Espejo de la Realidad',
  'ley-de-la-correspondencia-el-espejo-de-la-realidad',
  'Pasa del victimismo a la maestría. El exterior y las relaciones dolorosas no son un castigo — son un diagnóstico exacto de lo que hay que sanar internamente. Aprenderás a ordenar el plano físico inferior (limpieza) para alterar el plano mental superior. Incluye el Reto de los 9 Días.',
  'video',
  3, 50, false, false, 0,
  '[{"title": "El Reto de los 9 Días", "url": "", "type": "pdf"}]'::jsonb
);

-- Lección 4 — Ley de la Vibración
INSERT INTO public.lessons (
  module_id, title, slug, description, content_type,
  sort_order, xp_reward, is_free, is_published, duration_seconds,
  resources
) VALUES (
  v_module_id,
  'Ley de la Vibración: La Frecuencia de tu Realidad',
  'ley-de-la-vibracion-la-frecuencia-de-tu-realidad',
  'La ciencia de la emoción. Fusión de conceptos herméticos con física térmica. La metáfora de la radio: no puedes sintonizar abundancia si estás vibrando en miedo. Incluye acciones tácticas para subir gradualmente tu vibración: Ira → Escribir sin filtro; Miedo → Acción pequeña inmediata.',
  'video',
  4, 50, false, false, 0,
  '[{"title": "El Termómetro Emocional", "url": "", "type": "pdf"}]'::jsonb
);

-- Lección 5 — Ley de la Polaridad
INSERT INTO public.lessons (
  module_id, title, slug, description, content_type,
  sort_order, xp_reward, is_free, is_published, duration_seconds,
  resources
) VALUES (
  v_module_id,
  'Ley de la Polaridad: La Escala de tus Emociones',
  'ley-de-la-polaridad-la-escala-de-tus-emociones',
  'El arte de la Transmutación Mental. El amor y el odio no son opuestos — son la misma energía en distintos grados. Con el Termómetro Emocional aprenderás a no luchar contra la tristeza o el miedo, sino a deslizarte conscientemente por la escala, un grado a la vez.',
  'video',
  5, 50, false, false, 0,
  '[{"title": "El Termómetro Emocional", "url": "", "type": "pdf"}]'::jsonb
);

-- Lección 6 — Ley del Ritmo
INSERT INTO public.lessons (
  module_id, title, slug, description, content_type,
  sort_order, xp_reward, is_free, is_published, duration_seconds,
  resources
) VALUES (
  v_module_id,
  'Ley del Ritmo: El Péndulo de la Vida',
  'ley-del-ritmo-el-pendulo-de-la-vida',
  'Erradica la culpa del retroceso. Los bajones no son fracasos — son el movimiento natural del péndulo que sirve para recalibrar. Aprenderás la importancia de la Válvula emocional para evitar que el péndulo sea destructivo. Regla clave: no tomes decisiones importantes en el punto bajo del péndulo.',
  'video',
  6, 50, false, false, 0,
  '[{"title": "Protocolo de Anclaje de 5 Pasos", "url": "", "type": "pdf"}, {"title": "Audio Terapéutico Bonus", "url": "", "type": "video"}]'::jsonb
);

-- Lección 7 — Ley de Causa y Efecto
INSERT INTO public.lessons (
  module_id, title, slug, description, content_type,
  sort_order, xp_reward, is_free, is_published, duration_seconds,
  resources
) VALUES (
  v_module_id,
  'Ley de Causa y Efecto: De Víctima a Creador',
  'ley-de-causa-y-efecto-de-victima-a-creador',
  'Responsabilidad radical. El karma como ley natural, no como castigo. Descubrirás el espacio de libertad de Viktor Frankl — la pausa consciente entre el estímulo externo y tu respuesta interna — y cómo las semillas invisibles de tus pensamientos crean tu realidad futura.',
  'video',
  7, 50, false, false, 0,
  '[]'::jsonb
);

-- Lección 8 — Ley de la Generación (final, doble XP)
INSERT INTO public.lessons (
  module_id, title, slug, description, content_type,
  sort_order, xp_reward, is_free, is_published, duration_seconds,
  resources
) VALUES (
  v_module_id,
  'Ley de la Generación: El Arte de Crear tu Realidad',
  'ley-de-la-generacion-el-arte-de-crear-tu-realidad',
  'Integración del sistema completo. Equilibra tu Energía Femenina (sentir, recibir, fluir) y tu Energía Masculina (actuar, estructurar, poner límites) para no caer ni en el caos emocional ni en la rigidez controladora. La síntesis final de las 8 leyes.',
  'video',
  8, 100, false, false, 0,
  '[{"title": "Guía de Activación de Energías", "url": "", "type": "pdf"}]'::jsonb
);

RAISE NOTICE '8 lecciones creadas correctamente';
RAISE NOTICE '────────────────────────────────────────────────';
RAISE NOTICE 'formation_id: %', v_formation_id;
RAISE NOTICE 'module_id:    %', v_module_id;
RAISE NOTICE '────────────────────────────────────────────────';
RAISE NOTICE 'Próximos pasos:';
RAISE NOTICE '1. Ve a /admin/content/formations y edita la formación';
RAISE NOTICE '2. Sube el thumbnail desde el panel admin';
RAISE NOTICE '3. Añade video_url a cada lección desde /admin/content/lessons/{id}';
RAISE NOTICE '4. Sube los PDFs a Supabase Storage y actualiza los campos resources';
RAISE NOTICE '5. Publica lección por lección, luego módulo, luego formación';

END $$;
