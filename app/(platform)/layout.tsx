import { redirect } from "next/navigation"
import { Suspense } from "react"
import { PlatformSidebar } from "@/components/layout/platform-sidebar"
import { getAuthUser, getUserProfile } from "@/lib/data-access"
import { UserStoreProvider } from "@/lib/store/user-store"
import { HydrateStore } from "@/lib/store/hydrate-store"

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthUser()

  // Redirect to login if not authenticated
  if (!user) {
    redirect("/login")
  }

  // Fetch profile data (deduplicada via React.cache si una page la pide también)
  const profile = await getUserProfile(user.id)

  // El middleware ya maneja la protección de rutas por nivel de acceso.
  // El layout solo se encarga de componer la UI para todos los usuarios autenticados.

  const userData = {
    id: user.id,
    full_name: user.user_metadata?.full_name || profile?.full_name || "Usuario",
    email: user.email || "",
    avatarUrl: user.user_metadata?.avatar_url || profile?.avatar_url,
    role: profile?.role || "student",
    level: profile?.level || 1,
    xp: profile?.xp ?? 0,
  }

  const streak = profile?.streak_days || 0

  return (
    <UserStoreProvider>
      {/* Hydrate client store with server-fetched user data */}
      <HydrateStore
        xp={profile?.xp ?? 0}
        level={profile?.level ?? 1}
        streakDays={streak}
        completedLessons={[]}
      />
      <div className="min-h-screen bg-background">
        <PlatformSidebar user={userData} streak={streak} />
        <main className="md:pl-64 transition-all duration-300">
          <div className="container mx-auto p-6 pt-20 md:pt-6">
            <Suspense>{children}</Suspense>
          </div>
        </main>
      </div>
    </UserStoreProvider>
  )
}
