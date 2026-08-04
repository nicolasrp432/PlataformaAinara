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
 * Al pasar a estática, la consulta ocurre en tiempo de build. Si Supabase no
 * responde o falta la configuración, la página se genera igualmente con el
 * escaparate de ejemplo en vez de tumbar el despliegue.
 */
async function getPublishedFormations(): Promise<LandingFormation[]> {
  try {
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
    console.error("Portada: no se pudo cargar el catálogo publicado.", err)
    return []
  }
}

export default async function HomePage() {
  const formations = await getPublishedFormations()
  return <LandingPage formations={formations} />
}
