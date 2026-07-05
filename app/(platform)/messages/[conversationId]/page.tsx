import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getConversationMessages, markConversationRead } from "@/lib/services/messaging"
import { MessagesThread } from "./messages-thread"

interface PageProps {
  params: Promise<{ conversationId: string }>
}

export const metadata = { title: "Conversación" }

export default async function ConversationPage({ params }: PageProps) {
  const { conversationId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const messages = await getConversationMessages(conversationId, user.id)
  if (messages === null) notFound()

  // Obtener info del otro participante
  const { data: participants } = await supabase
    .from("conversation_participants")
    .select("user_id, profiles(id, full_name, avatar_url)")
    .eq("conversation_id", conversationId)
    .neq("user_id", user.id)
    .limit(1)

  const rawProfiles = participants?.[0]?.profiles
  const other = (Array.isArray(rawProfiles) ? rawProfiles[0] : rawProfiles) as
    | { id: string; full_name: string; avatar_url: string | null }
    | null

  // Marcar como leído al abrir
  await markConversationRead(conversationId, user.id)

  const safeMessages = (messages ?? []).map((m) => {
    const rawP = (m as Record<string, unknown>).profiles
    const profiles = (Array.isArray(rawP) ? rawP[0] : rawP) as
      | { id: string; full_name: string; avatar_url: string | null }
      | null
    return {
      id: m.id as string,
      sender_id: m.sender_id as string,
      body: m.body as string,
      created_at: m.created_at as string,
      profiles,
    }
  })

  return (
    <MessagesThread
      conversationId={conversationId}
      currentUserId={user.id}
      otherUser={other}
      initialMessages={safeMessages}
    />
  )
}
