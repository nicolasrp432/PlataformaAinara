import { cache } from "react"
import { createClient } from "@/lib/supabase/server"

// ─── Auth & Profile (deduplicadas por React.cache) ─────────────────────

/**
 * Deduplicada automáticamente por React dentro del mismo request.
 * Layout + Page + helpers que llamen getAuthUser() solo ejecutan 1 query real.
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
})

/**
 * Perfil completo del usuario. Deduplicado por cache().
 */
export const getUserProfile = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()
  return data
})

// ─── Dashboard Data (1 batch en vez de ~8 queries) ─────────────────────

export const getDashboardData = cache(async (userId: string) => {
  const supabase = await createClient()

  // 4 queries en paralelo en vez de ~8 secuenciales
  const [
    { data: profile },
    { count: totalEnrollments },
    { count: completedEnrollments },
    { count: lessonsCompleted },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase
      .from("enrollments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("enrollments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .not("completed_at", "is", null),
    supabase
      .from("user_progress")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_completed", true),
  ])

  return {
    stats: {
      formationsInProgress:
        (totalEnrollments || 0) - (completedEnrollments || 0),
      formationsCompleted: completedEnrollments || 0,
      lessonsCompleted: lessonsCompleted || 0,
      totalXp: profile?.xp ?? 0,
      currentStreak: profile?.streak_days ?? 0,
      level: profile?.level || 1,
      nextLevelProgress: ((profile?.xp || 0) % 500) / 5,
    },
    profile,
  }
})

export const getFormationsInProgress = cache(async (userId: string) => {
  const supabase = await createClient()

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(
      `
      *,
      formation:formations (
        id,
        title,
        slug,
        thumbnail_url,
        modules (
          id,
          lessons (id)
        )
      )
    `
    )
    .eq("user_id", userId)
    .is("completed_at", null)
    .order("enrolled_at", { ascending: false })
    .limit(3)

  if (!enrollments || enrollments.length === 0) return []

  // Recopilar TODOS los lesson IDs de todas las formaciones en 1 sola pasada
  const allLessonIds: string[] = []
  const formationLessonMap: Record<string, string[]> = {}

  for (const enrollment of enrollments) {
    const formation = enrollment.formation as any
    if (!formation) continue
    const lessonIds =
      formation.modules?.flatMap(
        (mod: any) => mod.lessons?.map((l: any) => l.id) || []
      ) || []
    formationLessonMap[formation.id] = lessonIds
    allLessonIds.push(...lessonIds)
  }

  // 1 SOLA query para obtener progreso de TODAS las lecciones (elimina N+1)
  let completedLessonIds: string[] = []
  if (allLessonIds.length > 0) {
    const { data: progress } = await supabase
      .from("user_progress")
      .select("lesson_id")
      .eq("user_id", userId)
      .in("lesson_id", allLessonIds)
      .eq("is_completed", true)
    completedLessonIds = progress?.map((p) => p.lesson_id) || []
  }

  // Calcular progreso por formación en JS (sin queries adicionales)
  return enrollments
    .map((enrollment) => {
      const formation = enrollment.formation as any
      if (!formation) return null

      const lessonIds = formationLessonMap[formation.id] || []
      const totalLessons = lessonIds.length
      const completed = lessonIds.filter((id) =>
        completedLessonIds.includes(id)
      ).length

      return {
        id: formation.id,
        title: formation.title,
        slug: formation.slug,
        progress:
          totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0,
        lessonsCompleted: completed,
        totalLessons,
        thumbnailUrl: formation.thumbnail_url,
      }
    })
    .filter(Boolean)
})

export const getRecentActivity = cache(async (userId: string) => {
  const supabase = await createClient()

  const { data: progress } = await supabase
    .from("user_progress")
    .select("*, lesson:lessons(id, title)")
    .eq("user_id", userId)
    .eq("is_completed", true)
    .order("completed_at", { ascending: false })
    .limit(5)

  if (!progress) return []

  return progress.map((p) => ({
    type: "lesson_completed" as const,
    title: `Completaste: ${(p.lesson as any)?.title || "Leccion"}`,
    xp: 50,
    time: formatTimeAgo(p.completed_at),
  }))
})

// ─── Library Data ──────────────────────────────────────────────────────

export const getLibraryFormations = cache(
  async (userId: string | null) => {
    const supabase = await createClient()

    const { data: formations, error } = await supabase
      .from("formations")
      .select(
        `
      *,
      modules (
        id,
        lessons (id)
      )
    `
      )
      .eq("is_published", true)
      .order("sort_order", { ascending: true })

    if (error || !formations) return []

    // Si hay usuario, obtener enrollments + progreso en 1 batch
    let enrollments: any[] = []
    let completedLessonIds: string[] = []

    if (userId) {
      // 2 queries en paralelo en vez de N+1
      const allLessonIds = formations.flatMap(
        (f) =>
          f.modules?.flatMap(
            (mod: any) => mod.lessons?.map((l: any) => l.id) || []
          ) || []
      )

      const [enrollmentsRes, progressRes] = await Promise.all([
        supabase
          .from("enrollments")
          .select("formation_id, status")
          .eq("user_id", userId),
        allLessonIds.length > 0
          ? supabase
              .from("user_progress")
              .select("lesson_id")
              .eq("user_id", userId)
              .in("lesson_id", allLessonIds)
              .eq("is_completed", true)
          : Promise.resolve({ data: [] }),
      ])

      enrollments = enrollmentsRes.data || []
      completedLessonIds =
        (progressRes.data as any[])?.map((p: any) => p.lesson_id) || []
    }

    return formations.map((formation) => {
      const lessonIds =
        formation.modules?.flatMap(
          (mod: any) => mod.lessons?.map((l: any) => l.id) || []
        ) || []
      const lessonsCount = lessonIds.length

      const enrollment = enrollments.find(
        (e) => e.formation_id === formation.id
      )
      const isEnrolled = !!enrollment

      const completed = isEnrolled
        ? lessonIds.filter((id) => completedLessonIds.includes(id)).length
        : 0
      const progress =
        isEnrolled && lessonsCount > 0
          ? Math.round((completed / lessonsCount) * 100)
          : 0

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
  }
)

export const getCategories = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true })
  return data || []
})

// ─── Taberna Data ──────────────────────────────────────────────────────

export const getReflections = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase
    .from("reflections")
    .select(
      "*, profiles:user_id(full_name, avatar_url, role), lessons:lesson_id(title)"
    )
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(50)
  return data || []
})

// ─── Helpers ───────────────────────────────────────────────────────────

function formatTimeAgo(date: string | null): string {
  if (!date) return "Reciente"
  const now = new Date()
  const past = new Date(date)
  const diffMs = now.getTime() - past.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 60) return `Hace ${diffMins} minutos`
  if (diffHours < 24) return `Hace ${diffHours} horas`
  if (diffDays === 1) return "Ayer"
  return `Hace ${diffDays} dias`
}
