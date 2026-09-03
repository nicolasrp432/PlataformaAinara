import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getAuthUser, getFormationBySlug } from "@/lib/data-access"
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
    title: `${formation.title}`,
    description: formation.description,
  }
}

export default async function FormationDetailPage({ params }: PageProps) {
  const { slug } = await params

  // Reutiliza getAuthUser cacheado del layout (0 queries extra)
  const user = await getAuthUser()

  if (!user) redirect("/login")

  // El temario es visible para todo el mundo con sesión: se ve el mapa
  // completo de la formación y qué lección está abierta. El candado lo aplica
  // `getFormationBySlug`, que devuelve `unlockedLessons` y `hasFullAccess`.
  const formation = await getFormationBySlug(slug, user.id)

  if (!formation) {
    notFound()
  }

  return <FormationDetail formation={formation} isLoggedIn />
}
