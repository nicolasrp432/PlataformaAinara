import { createClient } from "@/lib/supabase/server"
import { LandingPage } from "./_landing/landing-page"

export const revalidate = 3600

export default async function HomePage() {
  const supabase = await createClient()

  const { data: formations } = await supabase
    .from("formations")
    .select("id, title, slug, description, thumbnail_url, difficulty, duration_minutes, is_premium, xp_reward")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(8)

  return <LandingPage formations={formations ?? []} />
}
