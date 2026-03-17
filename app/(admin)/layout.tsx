import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/layout/admin-sidebar"
import { createClient } from "@/lib/supabase/server"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()

  // Redirect if not authenticated
  if (error || !user) {
    redirect("/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const isAdmin = user.user_metadata?.role === "admin" || profile?.role === "admin"

  // Redirect if not admin
  if (!isAdmin) {
    redirect("/dashboard")
  }

  const userData = {
    id: user.id,
    name: user.user_metadata?.full_name || "Admin",
    email: user.email || "",
    avatarUrl: user.user_metadata?.avatar_url,
    role: "admin" as const,
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar user={userData} />
      <main className="md:pl-64 transition-all duration-300">
        <div className="container mx-auto p-6 pt-20 md:pt-6">
          {children}
        </div>
      </main>
    </div>
  )
}
