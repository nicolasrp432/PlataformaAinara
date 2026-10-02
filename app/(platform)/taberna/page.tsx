import { Metadata } from "next"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getAuthUser, getUserProfile, getReflections } from "@/lib/data-access"
import { hasFullAccess, resolveAccessTier } from "@/lib/access"
import { PageHeader } from "@/components/layout/page-header"
import { TabernaFeed } from "./taberna-feed"
import { TestimonialUploadForm } from "./testimonial-upload-form"
import { TestimonialGallery, type TestimonialCard } from "./testimonial-gallery"
import { createClient } from "@/lib/supabase/server"

/**
 * El feed se resuelve dentro de su propia frontera de Suspense: la cabecera
 * aparece en cuanto pasa el control de acceso, sin esperar a las reflexiones.
 */
async function Feed({
  currentUser,
}: {
  currentUser: { full_name: string; avatarUrl: string | null }
}) {
  const reflections = await getReflections()
  return <TabernaFeed initialReflections={reflections} currentUser={currentUser} />
}

function FeedSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="h-32 shimmer rounded-2xl border border-border/30" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-40 shimmer rounded-2xl border border-border/30" />
      ))}
    </div>
  )
}

export const metadata: Metadata = {
  title: "Comunidad",
  description: "Comparte y conecta con otros aprendices en la plataforma.",
}

export default async function TabernaPage() {
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  const profile = await getUserProfile(user.id)

  // Segunda capa de seguridad tras el middleware. Usa el mismo helper que el
  // resto de la app para que no pueda divergir de `lib/access.ts`.
  const tier = resolveAccessTier({
    role: profile?.role,
    accessStatus: profile?.access_status,
    hasLifetimeAccess: profile?.has_lifetime_access,
  })

  if (!hasFullAccess(tier)) {
    redirect("/billing?reason=subscription&from=/taberna")
  }

  const currentUser = {
    full_name: profile?.full_name || user.user_metadata?.full_name || "Aventurero",
    avatarUrl: (profile ? profile.avatar_url : user.user_metadata?.avatar_url) ?? null,
  }

  const supabase = await createClient()
  const { data: testimonialRows } = await supabase
    .from("community_testimonials")
    .select("id, caption, playback_url, thumbnail_url, created_at, consent_granted_at, profiles!author_id(full_name)")
    .eq("status", "published").is("deleted_at", null).order("created_at", { ascending: false }).limit(12)
  const testimonials: TestimonialCard[] = (testimonialRows || []).filter(row => Boolean(row.playback_url)).map(row => {
    const authors = row.profiles as unknown as { full_name: string | null } | { full_name: string | null }[] | null
    return {
      id: row.id, caption: row.caption, playback_url: row.playback_url!, thumbnail_url: row.thumbnail_url, created_at: row.created_at,
      authorName: row.consent_granted_at ? ((Array.isArray(authors) ? authors[0]?.full_name : authors?.full_name) || null) : null,
    }
  })

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10 relative">
      <PageHeader eyebrow="La Taberna · Comunidad" title={<>Un camino <em>compartido.</em></>} description="Comparte tus preguntas, escucha otras experiencias y encuentra compañía en el proceso." />

      <TestimonialUploadForm />
      <TestimonialGallery testimonials={testimonials} />

      <Suspense fallback={<FeedSkeleton />}>
        <Feed currentUser={currentUser} />
      </Suspense>
    </div>
  )
}
