import "server-only"
import { createClient as createServiceClient } from "@supabase/supabase-js"

/**
 * Tags centralizados para invalidación de caché cross-request (unstable_cache).
 * Se invalidan con revalidateTag() desde las mutaciones de contenido (admin).
 */
export const CACHE_TAGS = {
  /** Catálogo de formaciones publicadas (lista de /library). */
  formations: "formations",
  /** Lista de categorías. */
  categories: "categories",
  /** Estructura de una formación concreta (por slug). */
  formation: (slug: string) => `formation:${slug}`,
} as const

/**
 * Cliente Supabase con service-role SIN cookies.
 *
 * Es PURO (no lee la request) → seguro de usar dentro de `unstable_cache`,
 * donde el cliente basado en cookies (createClient de server.ts) lanzaría error.
 *
 * USAR EXCLUSIVAMENTE para CONTENIDO COMPARTIDO público del catálogo
 * (formaciones publicadas, conteos, categorías) que es idéntico para todos los
 * usuarios. NUNCA para datos privados por-usuario (progreso, enrollments, etc.).
 */
export function cacheServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
