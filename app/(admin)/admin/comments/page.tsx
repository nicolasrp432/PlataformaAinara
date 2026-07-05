import { createClient } from "@/lib/supabase/server"
import { CommentsClient } from "./comments-client"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Moderación de Comentarios — Admin",
}

export const dynamic = "force-dynamic"

export default async function CommentsPage() {
  const supabase = await createClient()

  // Query comments (reflections) with author profiles and lesson metadata
  const { data: reflections } = await supabase
    .from("reflections")
    .select(`
      id,
      content,
      created_at,
      user_id,
      profiles ( full_name, avatar_url, role ),
      lessons (
        title,
        module:modules (
          formation:formations ( title )
        )
      )
    `)
    .order("created_at", { ascending: false })
    .limit(100)

  interface DbReflection {
    id: string
    content: string
    created_at: string
    user_id: string
    profiles: {
      full_name: string | null
      avatar_url: string | null
      role: string | null
    } | null
    lessons: {
      title: string
      module: {
        formation: {
          title: string
        } | null
      } | null
    } | null
  }

  // Map to clean structure (avoid nested TS type issues in client component)
  const formattedComments = (reflections as unknown as DbReflection[] ?? []).map((ref) => ({
    id: ref.id,
    content: ref.content,
    created_at: ref.created_at,
    user_id: ref.user_id,
    profiles: ref.profiles ? {
      full_name: ref.profiles.full_name,
      avatar_url: ref.profiles.avatar_url,
      role: ref.profiles.role,
    } : null,
    lessons: ref.lessons ? {
      title: ref.lessons.title,
      module: {
        formation: {
          title: ref.lessons.module?.formation?.title ?? "Formación",
        }
      }
    } : null,
  }))

  return <CommentsClient initialComments={formattedComments} />
}
