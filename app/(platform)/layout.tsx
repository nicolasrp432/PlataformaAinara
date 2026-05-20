import { redirect } from "next/navigation"
import { Suspense } from "react"
import { PlatformSidebar } from "@/components/layout/platform-sidebar"
import { getAuthUser, getUserProfile } from "@/lib/data-access"

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

  // Access control: only approved users (or admins/mentors) can access the platform
  const accessStatus = profile?.access_status ?? "pending"
  const role = profile?.role ?? "student"
  const hasAccess =
    accessStatus === "approved" || role === "admin" || role === "mentor"

  if (!hasAccess) {
    redirect("/pending")
  }

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
    <div className="min-h-screen bg-background">
      <PlatformSidebar user={userData} streak={streak} />
      <main className="md:pl-64 transition-all duration-300">
        <div className="container mx-auto p-6 pt-20 md:pt-6">
          <Suspense>{children}</Suspense>
        </div>
      </main>
    </div>
  )
}
