import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FormationDetail } from "./formation-detail"

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getFormation(slug: string, userId: string | null) {
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
  
  if (error || !formation) {
    return null
  }
  
  // Sort modules and lessons by sort_order
  formation.modules = formation.modules
    ?.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
    .map((mod: any) => ({
      ...mod,
      lessons: mod.lessons?.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)) || []
    })) || []
  
  // Get enrollment and progress if user is logged in
  let isEnrolled = false
  let progress = 0
  let completedLessons: string[] = []
  
  if (userId) {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("*")
      .eq("user_id", userId)
      .eq("formation_id", formation.id)
      .single()
    
    isEnrolled = !!enrollment
    
    if (isEnrolled) {
      // Get completed lessons
      const lessonIds = formation.modules?.flatMap(
        (mod: any) => mod.lessons?.map((l: any) => l.id) || []
      ) || []
      
      const { data: userProgress } = await supabase
        .from("user_progress")
        .select("lesson_id")
        .eq("user_id", userId)
        .in("lesson_id", lessonIds.length > 0 ? lessonIds : ["none"])
        .eq("is_completed", true)
      
      completedLessons = userProgress?.map((p) => p.lesson_id) || []
      
      const totalLessons = lessonIds.length
      progress = totalLessons > 0 
        ? Math.round((completedLessons.length / totalLessons) * 100)
        : 0
    }
  }
  
  return {
    ...formation,
    isEnrolled,
    progress,
    completedLessons,
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()
  
  const { data: formation } = await supabase
    .from("formations")
    .select("title, description")
    .eq("slug", slug)
    .single()
  
  if (!formation) {
    return { title: "Formacion no encontrada" }
  }
  
  return {
    title: `${formation.title} | Ainara`,
    description: formation.description,
  }
}

export default async function FormationDetailPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const formation = await getFormation(slug, user?.id || null)
  
  if (!formation) {
    notFound()
  }

  return (
    <FormationDetail 
      formation={formation}
      isLoggedIn={!!user}
    />
  )
}
