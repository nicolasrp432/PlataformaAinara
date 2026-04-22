import { createClient } from '@/lib/supabase/server';

/**
 * Sube un archivo al bucket de almacenamiento estructurado de Supabase.
 * @param file El archivo a subir
 * @param bucket Nombre del bucket (ej: 'public_assets')
 * @param path Directorio opcional dentro del bucket (ej: 'thumbnails/formations')
 */
export async function uploadPublicAsset(file: File, bucket = 'public_assets', path = '') {
  const supabase = await createClient();
  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const fullPath = path ? `${path}/${filename}` : filename;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fullPath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Error al subir imagen a ${bucket}: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(fullPath);

  return publicUrlData.publicUrl;
}
