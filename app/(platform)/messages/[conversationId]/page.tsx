import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getConversationMessages, markConversationRead } from "@/lib/services/messaging"
import { MessagesThread } from "./messages-thread"

interface PageProps {
  params: Promise<{ conversationId: string }>
}

export const metadata = { title: "Conversación | Sendero" }

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

  const other = participants?.[0]?.profiles as
    | { id: string; full_name: string; avatar_url: string | null }
    | null

  // Marcar como leído al abrir
  await markConversationRead(conversationId, user.id)

  return (
    <MessagesThread
      conversationId={conversationId}
      currentUserId={user.id}
      otherUser={other}
      initialMessages={messages as Parameters<typeof MessagesThread>[0]["initialMessages"]}
    />
  )
}
