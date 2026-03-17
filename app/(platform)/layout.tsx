import { redirect } from "next/navigation"
import { PlatformSidebar } from "@/components/layout/platform-sidebar"
import { createClient } from "@/lib/supabase/server"

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (error || !user) {
    redirect("/login")
  }

  // Fetch profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const userData = {
    id: user.id,
    name: user.user_metadata?.full_name || profile?.full_name || "Usuario",
    email: user.email || "",
    avatarUrl: user.user_metadata?.avatar_url || profile?.avatar_url,
    role: profile?.role || "student",
    level: profile?.level || 1,
    xp: profile?.xp_total || 0,
  }

  const streak = profile?.streak_days || 0

  return (
    <div className="min-h-screen bg-background">
      <PlatformSidebar user={userData} streak={streak} />
      <main className="md:pl-64 transition-all duration-300">
        <div className="container mx-auto p-6 pt-20 md:pt-6">
          {children}
        </div>
      </main>
    </div>
  )
}
