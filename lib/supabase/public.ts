import "server-only"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Cliente anónimo SIN cookies para contenido público.
 *
 * El cliente de `lib/supabase/server.ts` lee cookies, y eso obliga a Next a
 * renderizar la ruta de forma dinámica en cada visita — aunque la página
 * declare `revalidate`. Para datos públicos idénticos para todo el mundo (el
 * catálogo de formaciones publicadas de la portada) no hace falta sesión, así
 * que con este cliente la página se puede generar estáticamente y servirse
 * desde el CDN.
 *
 * Usa la clave anónima, así que sigue sujeto a RLS: solo ve lo que cualquier
 * visitante vería. No sustituye a `cacheServiceClient()` de lib/cache.ts, que
 * usa service-role y sirve para otro propósito.
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Las páginas estáticas se generan en tiempo de build: si falta la
  // configuración, es mejor un error explícito que el cliente reventando
  // dentro con un mensaje opaco. Quien llama debe capturarlo y degradar.
  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY."
    )
  }

  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
