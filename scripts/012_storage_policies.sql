-- ============================================================
-- 012_storage_policies.sql
-- Configuración de Bucket y Políticas de Storage (public_assets)
-- Permite acceso de lectura público y subidas solo para administradores
-- Aplica en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Asegurar que el bucket public_assets existe y es público
INSERT INTO storage.buckets (id, name, public)
VALUES ('public_assets', 'public_assets', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Habilitar RLS en la tabla de objetos de almacenamiento
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas previas para evitar conflictos al re-ejecutar
DROP POLICY IF EXISTS "Public Access to public_assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin Insert to public_assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update to public_assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete to public_assets" ON storage.objects;

-- 1. Permitir acceso público de lectura (SELECT) a cualquier archivo en public_assets
CREATE POLICY "Public Access to public_assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'public_assets');

-- 2. Permitir inserción (INSERT) a administradores autenticados
CREATE POLICY "Admin Insert to public_assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'public_assets' AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 3. Permitir actualización (UPDATE) a administradores autenticados
CREATE POLICY "Admin Update to public_assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'public_assets' AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 4. Permitir eliminación (DELETE) a administradores autenticados
CREATE POLICY "Admin Delete to public_assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'public_assets' AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
