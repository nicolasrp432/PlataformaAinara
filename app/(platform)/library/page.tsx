import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getAuthUser, getUserProfile, getLibraryFormations, getCategories } from "@/lib/data-access"
import { LibraryContent } from "./library-content"

export const metadata = {
  title: "Biblioteca",
  description: "Explora nuestras formaciones y comienza tu viaje de transformacion",
}

export default async function LibraryPage() {
  const user = await getAuthUser()

  if (!user) redirect("/login")

  // Verificación de acceso: segunda capa de seguridad después del middleware
  const profile = await getUserProfile(user.id)
  const hasAccess =
    profile?.access_status === "approved" ||
    profile?.role === "admin" ||
    profile?.role === "mentor"

  if (!hasAccess) {
    redirect("/billing?reason=subscription")
  }

  // 2 queries paralelas, sin N+1
  const [formations, categories] = await Promise.all([
    getLibraryFormations(user?.id || null),
    getCategories(),
  ])

  return (
    <Suspense fallback={<LibraryLoading />}>
      <LibraryContent
        formations={formations}
        categories={categories}
        isLoggedIn={!!user}
      />
    </Suspense>
  )
}

function LibraryLoading() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10 animate-pulse">
      <div>
        <div className="h-8 w-64 bg-muted rounded" />
        <div className="h-4 w-96 bg-muted rounded mt-2" />
      </div>
      <div className="flex gap-2 p-4 rounded-2xl border border-border/50 bg-card/40">
        <div className="h-8 w-20 bg-muted rounded-md" />
        <div className="h-8 w-28 bg-muted rounded-md" />
        <div className="h-8 w-28 bg-muted rounded-md" />
        <div className="ml-auto h-8 w-48 bg-muted rounded-md" />
        <div className="h-8 w-36 bg-muted rounded-md" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-lg border border-border/50 overflow-hidden">
            <div className="aspect-video bg-muted" />
            <div className="p-5 space-y-3">
              <div className="h-3 w-20 bg-muted rounded-full" />
              <div className="h-5 w-3/4 bg-muted rounded" />
              <div className="h-3 w-full bg-muted/70 rounded" />
              <div className="h-3 w-2/3 bg-muted/70 rounded" />
              <div className="flex gap-4 pt-2 border-t border-border/50">
                <div className="h-3 w-16 bg-muted rounded" />
                <div className="h-3 w-20 bg-muted rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
