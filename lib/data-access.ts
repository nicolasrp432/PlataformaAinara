/* eslint-disable @typescript-eslint/no-explicit-any */

import { cache } from "react"
import { unstable_cache } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { cacheServiceClient, CACHE_TAGS } from "@/lib/cache"
import { progressToNextLevel } from "@/lib/utils"

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

  // Calcular el lunes de esta semana a las 00:00:00
  const today = new Date()
  const dayOfWeek = today.getDay()
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const mondayOfThisWeek = new Date(today)
  mondayOfThisWeek.setDate(today.getDate() - daysToSubtract)
  mondayOfThisWeek.setHours(0, 0, 0, 0)

  // 5 queries en paralelo
  const [
    { data: profile },
    { count: totalEnrollments },
    { count: completedEnrollments },
    { count: lessonsCompleted },
    { data: currentWeekProgress },
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
    supabase
      .from("user_progress")
      .select("completed_at")
      .eq("user_id", userId)
      .eq("is_completed", true)
      .gte("completed_at", mondayOfThisWeek.toISOString()),
  ])

  // Calcular XP por día de la semana: 0=Lunes, ..., 6=Domingo
  const weeklyXp = [0, 0, 0, 0, 0, 0, 0]
  if (currentWeekProgress) {
    currentWeekProgress.forEach((p) => {
      if (!p.completed_at) return
      const date = new Date(p.completed_at)
      const day = date.getDay()
      const index = day === 0 ? 6 : day - 1
      weeklyXp[index] += 50
    })
  }

  return {
    stats: {
      formationsInProgress:
        (totalEnrollments || 0) - (completedEnrollments || 0),
      formationsCompleted: completedEnrollments || 0,
      lessonsCompleted: lessonsCompleted || 0,
      totalXp: profile?.xp ?? 0,
      currentStreak: profile?.streak_days ?? 0,
      level: profile?.level || 1,
      nextLevelProgress: progressToNextLevel(profile?.xp || 0),
      weeklyXp,
    },
    profile,
  }
})

export const getFormationsInProgress = cache(async (userId: string) => {
  const supabase = await createClient()

  type FormationInProgress = {
    id: string
    title: string
    slug: string
    progress: number
    lessonsCompleted: number
    totalLessons: number
    thumbnailUrl: string | null
  }

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
    .filter((formation): formation is FormationInProgress => formation !== null)
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

/**
 * Base COMPARTIDA del catálogo: formaciones publicadas + ids de sus lecciones.
 * Idéntica para todos los usuarios → cacheada CROSS-REQUEST con unstable_cache
 * (service-role, sin cookies). Se procesa 1 sola vez y se reutiliza para todos
 * hasta que un admin edite contenido (revalidateTag(CACHE_TAGS.formations)).
 */
const getPublishedFormationsBase = unstable_cache(
  async () => {
    const supabase = cacheServiceClient()

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

    // Pre-calcular ids de lecciones por formación (evita recalcular por request)
    return formations.map((f) => ({
      ...f,
      _lessonIds:
        (f.modules as any[])?.flatMap(
          (mod: any) => mod.lessons?.map((l: any) => l.id) || []
        ) || [],
    }))
  },
  ["published-formations-base"],
  { tags: [CACHE_TAGS.formations] }
)

export const getLibraryFormations = cache(
  async (userId: string | null) => {
    // Contenido compartido (cacheado cross-request)
    const formations = await getPublishedFormationsBase()
    if (formations.length === 0) return []

    // Overlay por-usuario (NO cacheado cross-request: cambia por persona y debe
    // verse al instante). Sigue deduplicado por request vía React.cache.
    let enrollments: any[] = []
    let completedLessonIds: string[] = []

    if (userId) {
      const supabase = await createClient()
      // 2 queries en paralelo en vez de N+1
      const allLessonIds = formations.flatMap((f) => f._lessonIds)

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
      const lessonIds = formation._lessonIds
      const lessonsCount = lessonIds.length

      const enrollment = enrollments.find(
        (e) => e.formation_id === formation.id
      )
      const isEnrolled = !!enrollment

      const completed = isEnrolled
        ? lessonIds.filter((id: string) => completedLessonIds.includes(id)).length
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

// Categorías: RLS público (USING true) y casi nunca cambian → cache cross-request.
export const getCategories = unstable_cache(
  async () => {
    const supabase = cacheServiceClient()
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true })
    return data || []
  },
  ["categories"],
  { tags: [CACHE_TAGS.categories] }
)

// ─── Taberna Data ──────────────────────────────────────────────────────

export const getReflections = cache(async () => {
  const supabase = await createClient()

  const { data: topLevel } = await supabase
    .from("reflections")
    .select("id, user_id, lesson_id, content, is_public, likes_count, created_at, parent_id")
    .eq("is_public", true)
    .is("parent_id", null)
    .order("created_at", { ascending: false })
    .limit(50)

  if (!topLevel || topLevel.length === 0) return []

  const topLevelIds = topLevel.map((r) => r.id)

  const { data: replies } = await supabase
    .from("reflections")
    .select("id, user_id, lesson_id, content, is_public, likes_count, created_at, parent_id")
    .eq("is_public", true)
    .in("parent_id", topLevelIds)
    .order("created_at", { ascending: true })

  const allRows = [...topLevel, ...(replies || [])]
  const userIds = [...new Set(allRows.map((r) => r.user_id))]

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role")
    .in("id", userIds)

  const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]))

  const repliesByParent: Record<string, any[]> = {}
  for (const reply of replies || []) {
    if (!repliesByParent[reply.parent_id]) repliesByParent[reply.parent_id] = []
    repliesByParent[reply.parent_id].push({
      ...reply,
      profiles: profileMap[reply.user_id] ?? null,
      lessons: null,
    })
  }

  return topLevel.map((r) => ({
    ...r,
    profiles: profileMap[r.user_id] ?? null,
    lessons: null,
    replies: repliesByParent[r.id] || [],
  }))
})

// ─── Formation Detail (replaces inline getFormation) ───────────────────

export const getFormationBySlug = cache(
  async (slug: string, userId: string | null) => {
    const supabase = await createClient()

    const { data: formation, error } = await supabase
      .from("formations")
      .select(`
        *,
        modules (
          id,
          title,
          description,
          sort_order,
          lessons (
            id,
            title,
            description,
            duration_seconds,
            video_url,
            is_free,
            sort_order
          )
        )
      `)
      .eq("slug", slug)
      .eq("is_published", true)
      .single()

    if (error || !formation) return null

    // Sort modules and lessons by sort_order
    formation.modules = formation.modules
      ?.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((mod: any) => ({
        ...mod,
        lessons:
          mod.lessons?.sort(
            (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)
          ) || [],
      })) || []

    // If no user, return formation without enrollment data
    if (!userId) {
      return {
        ...formation,
        isEnrolled: false,
        progress: 0,
        completedLessons: [] as string[],
      }
    }

    // Parallel: enrollment + progress in 1 batch
    const lessonIds =
      formation.modules?.flatMap(
        (mod: any) => mod.lessons?.map((l: any) => l.id) || []
      ) || []

    const [{ data: enrollment }, progressRes] = await Promise.all([
      supabase
        .from("enrollments")
        .select("*")
        .eq("user_id", userId)
        .eq("formation_id", formation.id)
        .single(),
      lessonIds.length > 0
        ? supabase
            .from("user_progress")
            .select("lesson_id")
            .eq("user_id", userId)
            .in("lesson_id", lessonIds)
            .eq("is_completed", true)
        : Promise.resolve({ data: [] as any[] }),
    ])

    const isEnrolled = !!enrollment
    const completedLessons =
      (progressRes.data as any[])?.map((p: any) => p.lesson_id) || []
    const totalLessons = lessonIds.length
    const progress =
      isEnrolled && totalLessons > 0
        ? Math.round((completedLessons.length / totalLessons) * 100)
        : 0

    return {
      ...formation,
      isEnrolled,
      progress,
      completedLessons,
    }
  }
)

// ─── Lesson Page Data (replaces inline getLessonData) ──────────────────

export const getLessonPageData = cache(
  async (slug: string, lessonId: string, userId: string) => {
    const supabase = await createClient()

    // 1. Get formation structure
    const { data: formation, error: formationError } = await supabase
      .from("formations")
      .select(`
        id, title, slug,
        modules (
          id, title, sort_order,
          lessons (
            id, title, description, duration_seconds, video_url, is_free, sort_order, xp_reward, content_type, transcript
          )
        )
      `)
      .eq("slug", slug)
      .single()

    if (formationError || !formation) return null

    // Sort modules and lessons
    formation.modules = formation.modules
      ?.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((mod: any) => ({
        ...mod,
        lessons:
          mod.lessons?.sort(
            (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)
          ) || [],
      })) || []

    // Flatten all lessons
    const allLessons: any[] = []
    formation.modules.forEach((mod: any) => {
      mod.lessons.forEach((les: any) => {
        allLessons.push({ ...les, module: mod })
      })
    })

    // Find current, previous, next
    let currentLesson: any = null
    let currentModule: any = null
    let previousLesson: any = null
    let nextLesson: any = null

    for (let i = 0; i < allLessons.length; i++) {
      if (allLessons[i].id === lessonId) {
        currentLesson = allLessons[i]
        currentModule = allLessons[i].module
        if (i > 0) previousLesson = allLessons[i - 1]
        if (i < allLessons.length - 1) nextLesson = allLessons[i + 1]
        break
      }
    }

    if (!currentLesson) return null

    // 2. Parallel: enrollment + progress + comments (3 queries → 1 batch)
    const lessonIds = allLessons.map((l) => l.id)

    const [{ data: enrollment }, { data: userProgress }, { data: rawComments }] =
      await Promise.all([
        supabase
          .from("enrollments")
          .select("*")
          .eq("user_id", userId)
          .eq("formation_id", formation.id)
          .single(),
        supabase
          .from("user_progress")
          .select("lesson_id, is_completed, watched_seconds")
          .eq("user_id", userId)
          .in("lesson_id", lessonIds),
        supabase
          .from("reflections")
          .select("id, content, created_at, user_id, parent_id")
          .eq("lesson_id", lessonId)
          .order("created_at", { ascending: true }),
      ])

    // Fetch comment author profiles + reactions in parallel
    const commentIds = (rawComments || []).map((c) => c.id)
    const commentUserIds = [...new Set((rawComments || []).map((c) => c.user_id))]

    const [{ data: commentProfiles }, { data: rawReactions }] = await Promise.all([
      commentUserIds.length > 0
        ? supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", commentUserIds)
        : Promise.resolve({ data: [] as { id: string; full_name: string | null; avatar_url: string | null }[] }),
      commentIds.length > 0
        ? supabase
            .from("reflection_reactions")
            .select("reflection_id, user_id, reaction_type")
            .in("reflection_id", commentIds)
        : Promise.resolve({ data: [] as { reflection_id: string; user_id: string; reaction_type: string }[] }),
    ])

    const commentProfileMap = Object.fromEntries(
      (commentProfiles || []).map((p) => [p.id, p])
    )

    // Agregar reactions por (reflection_id, type) y flag userReacted
    const reactionsByComment = new Map<string, Record<string, { count: number; userReacted: boolean }>>()
    for (const r of rawReactions || []) {
      const bucket = reactionsByComment.get(r.reflection_id) ?? {}
      const entry = bucket[r.reaction_type] ?? { count: 0, userReacted: false }
      entry.count += 1
      if (r.user_id === userId) entry.userReacted = true
      bucket[r.reaction_type] = entry
      reactionsByComment.set(r.reflection_id, bucket)
    }

    // Construir árbol (2 niveles: root → replies). Mantener orden por created_at ascendente.
    type ThreadedComment = {
      id: string
      content: string
      created_at: string
      user_id: string
      parent_id: string | null
      profiles: { id: string; full_name: string | null; avatar_url: string | null } | null
      reactions: Record<string, { count: number; userReacted: boolean }>
      replies: ThreadedComment[]
    }

    const allComments: ThreadedComment[] = (rawComments || []).map((c) => ({
      id: c.id,
      content: c.content,
      created_at: c.created_at,
      user_id: c.user_id,
      parent_id: c.parent_id ?? null,
      profiles: commentProfileMap[c.user_id] ?? null,
      reactions: reactionsByComment.get(c.id) ?? {},
      replies: [],
    }))

    const byId = new Map(allComments.map((c) => [c.id, c]))
    const rootComments: ThreadedComment[] = []
    for (const c of allComments) {
      if (c.parent_id && byId.has(c.parent_id)) {
        byId.get(c.parent_id)!.replies.push(c)
      } else {
        rootComments.push(c)
      }
    }
    // Root descendente (más recientes arriba), replies ascendente (orden cronológico).
    rootComments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const comments = rootComments

    const isEnrolled = !!enrollment

    // If not enrolled and lesson is not free, signal redirect
    if (!isEnrolled && !currentLesson.is_free) {
      return { notEnrolled: true, formationSlug: formation.slug }
    }

    const completedLessons =
      userProgress?.filter((p) => p.is_completed).map((p) => p.lesson_id) || []
    const currentProgress = userProgress?.find(
      (p) => p.lesson_id === lessonId
    )

    // Build curriculum with completion status
    const curriculum = formation.modules.map(
      (mod: any, modIndex: number) => ({
        id: mod.id,
        title: mod.title,
        order: modIndex + 1,
        lessons: mod.lessons.map((les: any) => ({
          id: les.id,
          title: les.title,
          isCompleted: completedLessons.includes(les.id),
          isCurrent: les.id === lessonId,
        })),
      })
    )

    return {
      lesson: {
        id: currentLesson.id,
        title: currentLesson.title,
        description: currentLesson.description,
        videoUrl: currentLesson.video_url,
        durationSeconds: currentLesson.duration_seconds,
        xpReward: currentLesson.xp_reward ?? 50,
        isCompleted: completedLessons.includes(currentLesson.id),
        watchedSeconds: currentProgress?.watched_seconds || 0,
        contentType: (currentLesson.content_type ?? "video") as "video" | "text" | "quiz" | "exercise" | "meditation",
        transcript: currentLesson.transcript as string | null,
      },
      comments,
      module: {
        id: currentModule.id,
        title: currentModule.title,
        order:
          formation.modules.findIndex(
            (m: any) => m.id === currentModule.id
          ) + 1,
      },
      formation: {
        id: formation.id,
        title: formation.title,
        slug: formation.slug,
      },
      curriculum,
      previousLesson: previousLesson
        ? { id: previousLesson.id, title: previousLesson.title }
        : null,
      nextLesson: nextLesson
        ? { id: nextLesson.id, title: nextLesson.title }
        : null,
      completedCount: completedLessons.length,
      totalCount: allLessons.length,
    }
  }
)

// ─── Quest Data (3 sequential queries → 1 parallel batch) ─────────────

export const getQuestData = cache(async (userId: string) => {
  const supabase = await createClient()

  const [{ data: profile }, { count: reflexCount }, { count: lessonsCount }, { count: enrollmentsCount }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("level, xp, streak_days")
        .eq("id", userId)
        .single(),
      supabase
        .from("reflections")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("user_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_completed", true),
      supabase
        .from("enrollments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
    ])

  return {
    level: profile?.level || 1,
    xp: profile?.xp || 0,
    streakDays: profile?.streak_days || 0,
    lessonsCount: lessonsCount || 0,
    reflectionsCount: reflexCount || 0,
    enrollmentsCount: enrollmentsCount || 0,
    hasReflection: (reflexCount || 0) > 0,
    hasCompletedLesson: (lessonsCount || 0) > 0,
  }
})

// ─── Reflexión diaria privada ──────────────────────────────────────────

export type DailyReflectionEntry = {
  id: string
  entry_date: string
  mood: string
  content: string
  updated_at: string
}

export const getDailyReflectionData = cache(async (userId: string) => {
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data: entries } = await supabase
    .from("daily_reflections")
    .select("id, entry_date, mood, content, updated_at")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .limit(60)

  const recent = (entries ?? []) as DailyReflectionEntry[]
  const todayEntry = recent.find((e) => e.entry_date === today) ?? null

  // Racha: días consecutivos con entrada, contando desde hoy (o ayer si
  // hoy aún no se ha escrito).
  let streak = 0
  const dates = new Set(recent.map((e) => e.entry_date))
  const cursor = new Date()
  if (!dates.has(today)) cursor.setUTCDate(cursor.getUTCDate() - 1)
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak++
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }

  return { todayEntry, recent, streak, today }
})

// ─── Enrollment & Progress Point Queries ───────────────────────────────

export const getEnrollmentStatus = cache(
  async (userId: string, formationId: string) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("enrollments")
      .select("id, status, enrolled_at, completed_at, progress_percent")
      .eq("user_id", userId)
      .eq("formation_id", formationId)
      .single()

    if (error && error.code !== "PGRST116") return null
    if (!data) return null

    return {
      isEnrolled: true,
      status: data.status as "active" | "completed" | "cancelled",
      progressPercent: data.progress_percent ?? 0,
      enrolledAt: data.enrolled_at,
      completedAt: data.completed_at,
    }
  }
)

export const getUserWatchedLesson = cache(
  async (userId: string, lessonId: string) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("user_progress")
      .select("watched_seconds, last_position_seconds, is_completed, status, completed_at")
      .eq("user_id", userId)
      .eq("lesson_id", lessonId)
      .single()

    if (error && error.code !== "PGRST116") return null
    if (!data) return null

    return {
      watchedSeconds: data.watched_seconds ?? 0,
      lastPositionSeconds: data.last_position_seconds ?? 0,
      isCompleted: data.is_completed ?? false,
      status: data.status as "in_progress" | "completed" | null,
      completedAt: data.completed_at,
    }
  }
)

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
