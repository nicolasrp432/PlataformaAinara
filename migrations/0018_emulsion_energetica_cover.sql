-- =====================================================================
-- Migration 0018 — Portada de «Emulsión Energética»
--
-- `public/emulsion-energetica.png` ya estaba en el repositorio sin usarse: es
-- literalmente la portada del programa. Se aplica el mismo criterio que la
-- 0015 usó con Re-Conéctate.
--
-- La aplicación además resuelve esta portada en código
-- (`lib/formation-covers.ts`), así que se ve aunque esta migración no se haya
-- ejecutado. Esto deja el dato guardado, que es donde debe estar.
--
-- Idempotente y no destructivo: solo escribe si la portada está vacía, así que
-- nunca pisa una imagen subida desde el panel.
--
-- Se usa `translate()` en vez de `unaccent()` a propósito: `translate` es
-- parte del núcleo de Postgres y `unaccent` es una extensión que puede no
-- estar instalada en el proyecto.
-- =====================================================================

UPDATE public.formations
   SET thumbnail_url = '/emulsion-energetica.png'
 WHERE thumbnail_url IS NULL
   AND (
        translate(lower(slug),  'áéíóúü', 'aeiouu') LIKE 'emulsi%energ%'
     OR translate(lower(title), 'áéíóúü', 'aeiouu') LIKE 'emulsi%energ%'
   );

-- Comprobación: debe devolver la formación con su portada ya asignada.
--   SELECT slug, title, thumbnail_url
--     FROM public.formations
--    WHERE translate(lower(title), 'áéíóúü', 'aeiouu') LIKE 'emulsi%energ%';
