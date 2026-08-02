-- ============================================================================
-- 0015 — Publicación del contenido + portadas + vídeos de las lecciones
-- ============================================================================
--
-- Contexto: los seeds `scripts/006_seed_leyes_universales.sql` y
-- `scripts/007_seed_re-conecta.sql` insertan formaciones, módulos y las 44
-- lecciones con `is_published = false`, sin `thumbnail_url` y sin `video_url`
-- (ellos mismos lo indican en su RAISE NOTICE final). Por eso:
--   · la landing recibe 0 formaciones publicadas y cae a sus tarjetas de
--     ejemplo hardcodeadas, que no tienen imagen;
--   · la biblioteca sale vacía;
--   · todas las lecciones muestran "Video no disponible".
--
-- Va toda dentro de una transacción: si algo falla no se aplica nada, y se
-- puede volver a lanzar entera sin efectos secundarios.
--
-- Esta migración es IDEMPOTENTE y CONSERVADORA: todos los UPDATE llevan
-- `IS NULL` en la columna que escriben, así que NUNCA pisan una portada o un
-- vídeo que ya hayas configurado desde el panel de admin. Se puede ejecutar
-- las veces que haga falta.
--
-- IMPORTANTE sobre los vídeos: son ENLACES TEMPORALES de YouTube, de vídeos
-- públicos en español relacionados con el tema de cada lección, para que la
-- plataforma se pueda usar de principio a fin mientras grabas los tuyos.
-- Sustitúyelos desde /admin/content/lessons/{id} → pestaña "Video".
-- ============================================================================

BEGIN;

-- ── 1. PORTADA DE FORMACIÓN ────────────────────────────────────────────────
-- `public/re-conectate-portada.png` ya estaba en el repo sin usarse y es
-- literalmente la portada del programa. Las formaciones sin portada muestran
-- una portada generada (componente FormationCover), así que no queda hueco.

UPDATE public.formations
   SET thumbnail_url = '/re-conectate-portada.png'
 WHERE slug = 're-conecta'
   AND thumbnail_url IS NULL;

-- ── 2. PUBLICAR EL CONTENIDO ───────────────────────────────────────────────
-- No se toca `is_premium`: el gating de pago del middleware sigue igual.

UPDATE public.formations
   SET is_published = true
 WHERE slug IN ('leyes-universales-regulacion-emocional', 're-conecta')
   AND is_published = false;

UPDATE public.modules m
   SET is_published = true
  FROM public.formations f
 WHERE m.formation_id = f.id
   AND f.slug IN ('leyes-universales-regulacion-emocional', 're-conecta')
   AND m.is_published = false;

UPDATE public.lessons l
   SET is_published = true
  FROM public.modules m
  JOIN public.formations f ON f.id = m.formation_id
 WHERE l.module_id = m.id
   AND f.slug IN ('leyes-universales-regulacion-emocional', 're-conecta')
   AND l.is_published = false;

-- ── 3. content_type: NO SE TOCA ────────────────────────────────────────────
-- Nota para el futuro: el CHECK vivo de esta base de datos es el de
-- `migrations/0001_initial_schema.sql`:
--
--     content_type IN ('video', 'audio', 'text', 'quiz', 'exercise')
--
-- O sea, 'audio' es VÁLIDO y 'meditation' NO existe. El CHECK de
-- `scripts/003a_create_tables.sql` (que sí incluye 'meditation') pertenece a
-- otra rama del esquema que nunca se aplicó aquí — no te fíes de él.
-- El desplegable del panel de admin ya ofrece exactamente estos cinco valores.
--
-- Las lecciones con content_type = 'audio' se quedan como están: el visor solo
-- bifurca por 'exercise' y 'quiz', así que 'audio' cae en el reproductor de
-- vídeo, que es justo lo que queremos para un enlace de YouTube.

-- ── 4. VÍDEOS TEMPORALES ───────────────────────────────────────────────────
-- URL completa de YouTube: el reproductor (components/video/video-player.tsx)
-- parsea watch?v=, youtu.be/, /embed/ y /shorts/. Un ID suelto lo rompería.

-- ---- Formación: Leyes Universales y Regulación Emocional (8) --------------

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=Dhe617FtNxc'
 WHERE slug = 'ley-del-mentalismo-el-origen-de-la-experiencia' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=PHjQ6SIHj28'
 WHERE slug = 'el-mapa-de-tu-energia-los-arquetipos' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=UQwAxKcRI54'
 WHERE slug = 'ley-de-la-correspondencia-el-espejo-de-la-realidad' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=AyzAmM2sedc'
 WHERE slug = 'ley-de-la-vibracion-la-frecuencia-de-tu-realidad' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=ivRRaPrmPt4'
 WHERE slug = 'ley-de-la-polaridad-la-escala-de-tus-emociones' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=tpdEP_8Yu9g'
 WHERE slug = 'ley-del-ritmo-el-pendulo-de-la-vida' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=r1pCOQ1Dwqs'
 WHERE slug = 'ley-de-causa-y-efecto-de-victima-a-creador' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=zOFFzvj96K8'
 WHERE slug = 'ley-de-la-generacion-el-arte-de-crear-tu-realidad' AND video_url IS NULL;

-- ---- Formación: RE-CONECTA — Módulo 1: Consciencia emocional (5) ----------

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=bwLR89mBxW0'
 WHERE slug = 'rc-m1-que-es-la-voz-critica' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=GezR1Uhyblw'
 WHERE slug = 'rc-m1-como-se-forma-la-baja-autoestima' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=OFMvRwWNQRI'
 WHERE slug = 'rc-m1-impacto-dialogo-interno' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=fUJ83xCfV30'
 WHERE slug = 'rc-m1-sistema-nervioso-emociones' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=m8RBhKRYwcA'
 WHERE slug = 'rc-m1-autoobservacion-emocional' AND video_url IS NULL;

-- ---- Módulo 2: Desactiva la autocrítica automática (5) --------------------

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=KoTfbzw1gV0'
 WHERE slug = 'rc-m2-neurociencia-emocional' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=27RAVHmBKXI'
 WHERE slug = 'rc-m2-interrumpir-pensamientos-criticos' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=JJc6ULrEQjY'
 WHERE slug = 'rc-m2-regulacion-emocional' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=KmDVvUK0zIg'
 WHERE slug = 'rc-m2-reestructuracion-interna' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=4koq6duJfYA'
 WHERE slug = 'rc-m2-reprogramacion-dialogo-interno' AND video_url IS NULL;

-- ---- Módulo 3: Reconecta con tu esencia (6) ------------------------------

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=aNidOjCxeCs'
 WHERE slug = 'rc-m3-que-es-reconectar' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=aUCK9QvbMec'
 WHERE slug = 'rc-m3-regresa-al-cuerpo' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=fEfFRiJPSvI'
 WHERE slug = 'rc-m3-escucha-verdad-interior' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=2OgNIOD9cQk'
 WHERE slug = 'rc-m3-necesidades-reales' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=7-JmycArYnQ'
 WHERE slug = 'rc-m3-practica-vuelve-centro' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=AYjg0KBxdYc'
 WHERE slug = 'rc-m3-ritual-integracion' AND video_url IS NULL;

-- ---- Módulo 4: Nueva identidad emocional (5) -----------------------------

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=uD2BQBFRkRA'
 WHERE slug = 'rc-m4-identidad-emocional' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=0YNZK3A8JYQ'
 WHERE slug = 'rc-m4-cambiar-creencias-limitantes' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=6IRNuKdLcsY'
 WHERE slug = 'rc-m4-autoimagen-consciente' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=SgwgMw0OF7A'
 WHERE slug = 'rc-m4-reprogramacion-interna' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=mFd8GdH4YAw'
 WHERE slug = 'rc-m4-habitos-emocionales' AND video_url IS NULL;

-- ---- Módulo 5: Autoestima en la vida real (5) ----------------------------

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=GiuoPILxPpA'
 WHERE slug = 'rc-m5-limites-emocionales' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=oFfNwwSjPoM'
 WHERE slug = 'rc-m5-comunicacion-consciente' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=rd-9Oq2Qyxo'
 WHERE slug = 'rc-m5-dejar-de-agradar' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=xDOyAdEZStA'
 WHERE slug = 'rc-m5-relaciones-autoestima' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=yw046rErid8'
 WHERE slug = 'rc-m5-autoestima-energia-femenina' AND video_url IS NULL;

-- ---- Módulo 6: Integración y expansión (5) -------------------------------

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=Uy3lw5iIs2g'
 WHERE slug = 'rc-m6-sostener-transformacion' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=EYRj7WNIZT8'
 WHERE slug = 'rc-m6-cuando-recaigas' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=0vSox3Yeoig'
 WHERE slug = 'rc-m6-habitos-bienestar' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=3527B6eg9jA'
 WHERE slug = 'rc-m6-plan-crecimiento' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=Ij00XAbzCAI'
 WHERE slug = 'rc-m6-ritual-cierre' AND video_url IS NULL;

-- ---- Bonos exclusivos (5) ------------------------------------------------

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=SE1aWavt3t8'
 WHERE slug = 'rc-bonus1-silenciar-voz-critica' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=TfGL48VsP_A'
 WHERE slug = 'rc-bonus2-meditaciones-guiadas' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=sG5Xl0xAWO4'
 WHERE slug = 'rc-bonus3-bitacora-autoestima' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=rfzwn1ItCPM'
 WHERE slug = 'rc-bonus4-7-dias-sin-autocritica' AND video_url IS NULL;

UPDATE public.lessons SET video_url = 'https://www.youtube.com/watch?v=4uOrAvfjfu4'
 WHERE slug = 'rc-bonus5-sesion-grupal' AND video_url IS NULL;

COMMIT;

-- ── Comprobación (ejecútalo aparte para ver el resultado) ──────────────────
-- SELECT f.title AS formacion,
--        f.is_published,
--        f.thumbnail_url,
--        count(l.id)                                   AS lecciones,
--        count(l.id) FILTER (WHERE l.video_url IS NOT NULL) AS con_video,
--        count(l.id) FILTER (WHERE l.is_published)      AS publicadas
--   FROM public.formations f
--   JOIN public.modules  m ON m.formation_id = f.id
--   JOIN public.lessons  l ON l.module_id    = m.id
--  GROUP BY f.id, f.title, f.is_published, f.thumbnail_url
--  ORDER BY f.title;
