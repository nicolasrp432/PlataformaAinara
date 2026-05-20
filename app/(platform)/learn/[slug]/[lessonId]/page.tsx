import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getLessonPageData } from "@/lib/data-access"
import { LessonViewer } from "./lesson-viewer"

interface PageProps {
  params: Promise<{ slug: string; lessonId: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { lessonId } = await params
  const supabase = await createClient()
  
  const { data: lesson } = await supabase
    .from("lessons")
    .select("title")
    .eq("id", lessonId)
    .single()
  
  return {
    title: lesson ? `${lesson.title} | Sendero` : "Leccion | Sendero",
  }
}

export default async function LessonViewerPage({ params }: PageProps) {
  const { slug, lessonId } = await params

  // Reutiliza getAuthUser cacheado del layout
  const user = await getAuthUser()
  
  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(`/learn/${slug}/${lessonId}`)}`)
  }
  
  // Función centralizada: enrollment + progress + comments en paralelo
  const data = await getLessonPageData(slug, lessonId, user.id)
  
  if (!data) {
    notFound()
  }
  
  if ("notEnrolled" in data) {
    redirect(`/formations/${data.formationSlug}`)
  }

  return <LessonViewer data={data} currentUserId={user.id} />
}
