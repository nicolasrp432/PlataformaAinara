import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getAuthUser, getUserProfile, getReflections } from "@/lib/data-access"
import { TabernaFeed } from "./taberna-feed"

export const metadata: Metadata = {
  title: "La Taberna | Ainara",
  description: "Comparte y conecta con otros aprendices en la plataforma.",
}

export default async function TabernaPage() {
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  const [profile, reflections] = await Promise.all([
    getUserProfile(user.id),
    getReflections(),
  ])

  const currentUser = {
    full_name: user.user_metadata?.full_name || profile?.full_name || "Aventurero",
    avatarUrl: user.user_metadata?.avatar_url || profile?.avatar_url || null,
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10 relative">
      <div className="flex flex-col gap-2 relative z-10 mb-8">
        <h1 className="text-3xl font-light tracking-tight text-foreground sm:text-4xl">
          La <span className="font-semibold text-primary">Taberna</span>
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-xl">
          Un espacio sagrado para el debate, la reflexión e inspiración cruzada.
          Comparte lo que arde en tu mente y lee a otros exploradores.
        </p>
      </div>

      <TabernaFeed initialReflections={reflections} currentUser={currentUser} />
    </div>
  )
}
