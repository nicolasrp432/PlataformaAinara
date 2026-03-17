import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/layout/admin-sidebar"
import { getAdminSession } from "@/lib/auth"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAdminSession()

  // Redirect if not authenticated or not admin
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar user={session.user} />
      <main className="md:pl-64 transition-all duration-300">
        <div className="container mx-auto p-6 pt-20 md:pt-6">
          {children}
        </div>
      </main>
    </div>
  )
}
