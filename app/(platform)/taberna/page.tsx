import { Metadata } from "next"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getAuthUser, getUserProfile, getReflections } from "@/lib/data-access"
import { TabernaFeed } from "./taberna-feed"

/**
 * El feed se resuelve dentro de su propia frontera de Suspense: la cabecera
 * aparece en cuanto pasa el control de acceso, sin esperar a las reflexiones.
 */
async function Feed({
  currentUser,
}: {
  currentUser: { full_name: string; avatarUrl: string | null }
}) {
  const reflections = await getReflections()
  return <TabernaFeed initialReflections={reflections} currentUser={currentUser} />
}

function FeedSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="h-32 shimmer rounded-2xl border border-border/30" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-40 shimmer rounded-2xl border border-border/30" />
      ))}
    </div>
  )
}

export const metadata: Metadata = {
  title: "Comunidad",
  description: "Comparte y conecta con otros aprendices en la plataforma.",
}

export default async function TabernaPage() {
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  const profile = await getUserProfile(user.id)

  // Segunda capa de seguridad: solo suscriptores acceden a la comunidad
  const hasAccess =
    profile?.access_status === "approved" ||
    profile?.role === "admin" ||
    profile?.role === "mentor"

  if (!hasAccess) {
    redirect("/billing?reason=subscription")
  }

  const currentUser = {
    full_name: user.user_metadata?.full_name || profile?.full_name || "Aventurero",
    avatarUrl: user.user_metadata?.avatar_url || profile?.avatar_url || null,
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10 relative">
      <div className="flex flex-col gap-2 relative z-10 mb-8">
        <h1 className="text-3xl font-light tracking-tight text-foreground sm:text-4xl">
          La <span className="font-semibold text-primary">Comunidad</span>
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-xl">
          Un espacio sagrado para el debate, la reflexión e inspiración cruzada.
          Comparte lo que arde en tu mente y lee a otros exploradores.
        </p>
      </div>

      <Suspense fallback={<FeedSkeleton />}>
        <Feed currentUser={currentUser} />
      </Suspense>
    </div>
  )
}
