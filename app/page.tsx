import { createPublicClient } from "@/lib/supabase/public"
import { LandingPage } from "./_landing/landing-page"

export const revalidate = 3600

type LandingFormation = {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail_url: string | null
  difficulty: string | null
  duration_minutes: number | null
  is_premium: boolean | null
  xp_reward: number | null
}

/**
 * La portada se genera estáticamente y se revalida cada hora: el catálogo
 * publicado es idéntico para todo el mundo, así que no hace falta leer cookies
 * (que era lo que la forzaba a dinámica y anulaba el `revalidate`).
 *
 * OJO AL DESPLEGAR: al ser estática, esta consulta se ejecuta en la máquina
 * de build, no en cada visita. Si NEXT_PUBLIC_SUPABASE_URL o
 * NEXT_PUBLIC_SUPABASE_ANON_KEY no están disponibles durante `next build`,
 * la portada se publica con el catálogo vacío y así se queda hasta la
 * primera revalidación (1 h). No tumba el despliegue a propósito: es
 * preferible una portada incompleta a un deploy fallido. Pero las variables
 * tienen que estar puestas en el proveedor ANTES de compilar.
 */
async function getPublishedFormations(): Promise<LandingFormation[]> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key || url.includes("placeholder") || url.includes("your-project")) {
      return []
    }

    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from("formations")
      .select(
        "id, title, slug, description, thumbnail_url, difficulty, duration_minutes, is_premium, xp_reward"
      )
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(8)

    if (error) throw error
    return (data ?? []) as LandingFormation[]
  } catch (err) {
    if (process.env.NODE_ENV === "production") {
      console.error("Portada: no se pudo cargar el catálogo publicado.", err)
    }
    return []
  }
}

export default async function HomePage() {
  const formations = await getPublishedFormations()
  return <LandingPage formations={formations} />
}
