import { redirect } from "next/navigation"
import { PlatformSidebar } from "@/components/layout/platform-sidebar"
import { getSession } from "@/lib/auth"

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <PlatformSidebar user={session.user} streak={session.streak} />
      <main className="md:pl-64 transition-all duration-300">
        <div className="container mx-auto p-6 pt-20 md:pt-6">
          {children}
        </div>
      </main>
    </div>
  )
}
