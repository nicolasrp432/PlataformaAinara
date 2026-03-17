import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { LibraryContent } from "./library-content"

export const metadata = {
  title: "Biblioteca | Ainara",
  description: "Explora nuestras formaciones y comienza tu viaje de transformacion",
}

async function getFormations(userId: string | null) {
  const supabase = await createClient()
  
  // Get all published formations with their modules and lessons count
  const { data: formations, error } = await supabase
    .from("formations")
    .select(`
      *,
      modules (
        id,
        lessons (id)
      )
    `)
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
  
  if (error || !formations) {
    console.error("Error fetching formations:", error)
    return []
  }
  
  // If user is logged in, get their enrollments and progress
  let enrollments: any[] = []
  if (userId) {
    const { data } = await supabase
      .from("enrollments")
      .select("formation_id, status")
      .eq("user_id", userId)
    enrollments = data || []
  }
  
  // Process formations with lessons count and user progress
  const processedFormations = await Promise.all(
    formations.map(async (formation) => {
      const lessonsCount = formation.modules?.reduce(
        (acc: number, mod: any) => acc + (mod.lessons?.length || 0),
        0
      ) || 0
      
      const enrollment = enrollments.find((e) => e.formation_id === formation.id)
      const isEnrolled = !!enrollment
      
      let progress = 0
      if (isEnrolled && userId) {
        // Get user progress for this formation
        const lessonIds = formation.modules?.flatMap(
          (mod: any) => mod.lessons?.map((l: any) => l.id) || []
        ) || []
        
        if (lessonIds.length > 0) {
          const { count } = await supabase
            .from("user_progress")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .in("lesson_id", lessonIds)
            .eq("is_completed", true)
          
          progress = lessonsCount > 0 
            ? Math.round(((count || 0) / lessonsCount) * 100)
            : 0
        }
      }
      
      return {
        id: formation.id,
        title: formation.title,
        slug: formation.slug,
        description: formation.description,
        thumbnailUrl: formation.thumbnail_url,
        difficulty: formation.difficulty || "beginner",
        duration: formation.duration_minutes || 0,
        lessonsCount,
        isPremium: formation.is_premium,
        isPublished: formation.is_published,
        progress,
        isEnrolled,
        isCompleted: enrollment?.status === "completed",
      }
    })
  )
  
  return processedFormations
}

async function getCategories() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true })
  
  return data || []
}

export default async function LibraryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const [formations, categories] = await Promise.all([
    getFormations(user?.id || null),
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
    <div className="space-y-8">
      <div>
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded mt-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-[4/3] bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  )
}
