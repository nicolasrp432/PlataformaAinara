-- Añade la columna likes_count a reflections si no existe.
-- Esto arregla el error silencioso en el botón "Resonar" de La Taberna.
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query

ALTER TABLE reflections
  ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Actualiza las filas existentes que puedan tener NULL
UPDATE reflections
  SET likes_count = 0
  WHERE likes_count IS NULL;
