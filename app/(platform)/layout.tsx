import { redirect } from "next/navigation"
import { Suspense } from "react"
import { PlatformSidebar } from "@/components/layout/platform-sidebar"
import { MobileTopBar } from "@/components/layout/mobile-top-bar"
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav"
import { getAuthUser, getUserProfile } from "@/lib/data-access"
import { UserStoreProvider } from "@/lib/store/user-store"
import { HydrateStore } from "@/lib/store/hydrate-store"
import { NotificationsProvider } from "@/components/notifications/notifications-provider"

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
      {/* Una sola suscripción Realtime a `notifications` para todo el layout:
          la campana y el badge de Mensajes se renderizan por duplicado entre
          sidebar y navegación móvil. */}
      <NotificationsProvider userId={user.id}>
        <div className="min-h-screen bg-background">
          <PlatformSidebar user={userData} streak={streak} />
          <MobileTopBar user={userData} streak={streak} />
          {/* --sidebar-w lo escribe el sidebar al colapsar; en móvil siempre 0 */}
          <main className="transition-[padding] duration-300 md:pl-[var(--sidebar-w,16rem)]">
            <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-4 md:px-6 md:pb-10 md:pt-6">
              <Suspense>{children}</Suspense>
            </div>
          </main>
          <MobileBottomNav user={userData} streak={streak} />
        </div>
      </NotificationsProvider>
    </UserStoreProvider>
  )
}
