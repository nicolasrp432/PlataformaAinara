import { Suspense } from "react"
import { getAuthUser, getLibraryFormations, getCategories } from "@/lib/data-access"
import { LibraryContent } from "./library-content"

export const metadata = {
  title: "Biblioteca | Ainara",
  description: "Explora nuestras formaciones y comienza tu viaje de transformacion",
}

export default async function LibraryPage() {
  const user = await getAuthUser()

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
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-8 w-64 bg-muted rounded" />
        <div className="h-4 w-96 bg-muted rounded mt-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-[4/3] bg-muted rounded-lg" />
        ))}
      </div>
    </div>
  )
}
