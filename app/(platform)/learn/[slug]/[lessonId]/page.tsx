import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { LessonViewer } from "./lesson-viewer"

interface PageProps {
  params: Promise<{ slug: string; lessonId: string }>
}

async function getLessonData(slug: string, lessonId: string, userId: string) {
  const supabase = await createClient()
  
  // Get formation with all modules and lessons
  const { data: formation, error: formationError } = await supabase
    .from("formations")
    .select(`
      id,
      title,
      slug,
      modules (
        id,
        title,
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
    .single()
  
  if (formationError || !formation) {
    return null
  }
  
  // Sort modules and lessons
  formation.modules = formation.modules
    ?.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
    .map((mod: any) => ({
      ...mod,
      lessons: mod.lessons?.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)) || []
    })) || []
  
  // Find current lesson and its module
  let currentLesson: any = null
  let currentModule: any = null
  let previousLesson: any = null
  let nextLesson: any = null
  let lessonIndex = 0
  
  // Flatten all lessons with their module info
  const allLessons: any[] = []
  formation.modules.forEach((mod: any) => {
    mod.lessons.forEach((les: any) => {
      allLessons.push({ ...les, module: mod })
    })
  })
  
  // Find current, previous, and next
  for (let i = 0; i < allLessons.length; i++) {
    if (allLessons[i].id === lessonId) {
      currentLesson = allLessons[i]
      currentModule = allLessons[i].module
      lessonIndex = i
      if (i > 0) previousLesson = allLessons[i - 1]
      if (i < allLessons.length - 1) nextLesson = allLessons[i + 1]
      break
    }
  }
  
  if (!currentLesson) {
    return null
  }
  
  // Check enrollment
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("*")
    .eq("user_id", userId)
    .eq("formation_id", formation.id)
    .single()
  
  const isEnrolled = !!enrollment
  
  // If not enrolled and lesson is not free, redirect
  if (!isEnrolled && !currentLesson.is_free) {
    return { notEnrolled: true, formationSlug: formation.slug }
  }
  
  // Get user progress for all lessons
  const lessonIds = allLessons.map((l) => l.id)
  const { data: userProgress } = await supabase
    .from("user_progress")
    .select("lesson_id, is_completed, watched_seconds")
    .eq("user_id", userId)
    .in("lesson_id", lessonIds)
  
  const completedLessons = userProgress?.filter((p) => p.is_completed).map((p) => p.lesson_id) || []
  const currentProgress = userProgress?.find((p) => p.lesson_id === lessonId)
  
  // Build curriculum with completion status
  const curriculum = formation.modules.map((mod: any, modIndex: number) => ({
    id: mod.id,
    title: mod.title,
    order: modIndex + 1,
    lessons: mod.lessons.map((les: any) => ({
      id: les.id,
      title: les.title,
      isCompleted: completedLessons.includes(les.id),
      isCurrent: les.id === lessonId,
    }))
  }))
  
  // Fetch Comments
  const { data: comments } = await supabase
    .from("reflections")
    .select(`
      id, content, created_at, user_id,
      profiles:user_id ( full_name, avatar_url, role )
    `)
    .eq("lesson_id", lessonId)
    .order("created_at", { ascending: false })

  return {
    lesson: {
      id: currentLesson.id,
      title: currentLesson.title,
      description: currentLesson.description,
      videoUrl: currentLesson.video_url,
      durationSeconds: currentLesson.duration_seconds,
      xpReward: 50, // Default XP per lesson
      isCompleted: completedLessons.includes(currentLesson.id),
      watchedSeconds: currentProgress?.watched_seconds || 0,
    },
    comments: (comments || []).map((c: any) => ({
      id: c.id,
      content: c.content,
      created_at: c.created_at,
      profiles: Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
    })),
    module: {
      id: currentModule.id,
      title: currentModule.title,
      order: formation.modules.findIndex((m: any) => m.id === currentModule.id) + 1,
    },
    formation: {
      id: formation.id,
      title: formation.title,
      slug: formation.slug,
    },
    curriculum,
    previousLesson: previousLesson ? { id: previousLesson.id, title: previousLesson.title } : null,
    nextLesson: nextLesson ? { id: nextLesson.id, title: nextLesson.title } : null,
    completedCount: completedLessons.length,
    totalCount: allLessons.length,
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { slug, lessonId } = await params
  const supabase = await createClient()
  
  const { data: lesson } = await supabase
    .from("lessons")
    .select("title")
    .eq("id", lessonId)
    .single()
  
  return {
    title: lesson ? `${lesson.title} | Ainara` : "Leccion | Ainara",
  }
}

export default async function LessonViewerPage({ params }: PageProps) {
  const { slug, lessonId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(`/learn/${slug}/${lessonId}`)}`)
  }
  
  const data = await getLessonData(slug, lessonId, user.id)
  
  if (!data) {
    notFound()
  }
  
  if ("notEnrolled" in data) {
    redirect(`/formations/${data.formationSlug}`)
  }

  return <LessonViewer data={data} />
}
