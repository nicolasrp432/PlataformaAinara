import { cache } from "react"
import { createClient } from "@/lib/supabase/server"

export interface RecentLesson {
  id: string
  title: string
  completed_at: string | null
  formation_slug: string
  formation_title: string
}

export interface RecentReflection {
  id: string
  content: string
  created_at: string
  lesson_title: string | null
  lesson_id: string | null
}

export interface ProfileActivity {
  recentLessons: RecentLesson[]
  recentReflections: RecentReflection[]
  totalEnrollments: number
}

export const getProfileActivity = cache(async (userId: string): Promise<ProfileActivity> => {
  const supabase = await createClient()

  const [
    { data: progress },
    { data: reflections },
    { count: enrollmentsCount },
  ] = await Promise.all([
    supabase
      .from("user_progress")
      .select("lesson_id, completed_at, lessons(id, title, modules(formations(slug, title)))")
      .eq("user_id", userId)
      .eq("is_completed", true)
      .order("completed_at", { ascending: false })
      .limit(5),
    supabase
      .from("reflections")
      .select("id, content, created_at, lesson_id, lessons(title)")
      .eq("user_id", userId)
      .is("parent_id", null)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("enrollments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
  ])

  const recentLessons: RecentLesson[] = (progress || []).flatMap((p) => {
    const lesson = Array.isArray(p.lessons) ? p.lessons[0] : p.lessons
    if (!lesson) return []
    const moduleRel = Array.isArray(lesson.modules) ? lesson.modules[0] : lesson.modules
    const formation = moduleRel
      ? Array.isArray(moduleRel.formations)
        ? moduleRel.formations[0]
        : moduleRel.formations
      : null
    return [{
      id: lesson.id,
      title: lesson.title,
      completed_at: p.completed_at ?? null,
      formation_slug: formation?.slug ?? "",
      formation_title: formation?.title ?? "Formación",
    }]
  })

  const recentReflections: RecentReflection[] = (reflections || []).map((r) => {
    const lesson = Array.isArray(r.lessons) ? r.lessons[0] : r.lessons
    return {
      id: r.id,
      content: r.content,
      created_at: r.created_at,
      lesson_title: lesson?.title ?? null,
      lesson_id: r.lesson_id ?? null,
    }
  })

  return {
    recentLessons,
    recentReflections,
    totalEnrollments: enrollmentsCount ?? 0,
  }
})
