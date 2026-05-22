import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getUserProfile, getFormationBySlug } from "@/lib/data-access"
import { FormationDetail } from "./formation-detail"

interface PageProps {
  params: Promise<{ slug: string }>
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
    title: `${formation.title} | Sendero`,
    description: formation.description,
  }
}

export default async function FormationDetailPage({ params }: PageProps) {
  const { slug } = await params

  // Reutiliza getAuthUser cacheado del layout (0 queries extra)
  const user = await getAuthUser()

  if (!user) redirect("/login")

  // Segunda capa de seguridad: solo suscriptores acceden a formaciones individuales
  const profile = await getUserProfile(user.id)
  const hasAccess =
    profile?.access_status === "approved" ||
    profile?.role === "admin" ||
    profile?.role === "mentor"

  if (!hasAccess) {
    redirect("/billing?reason=subscription")
  }

  // Función centralizada con queries paralelas
  const formation = await getFormationBySlug(slug, user?.id || null)
  
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
