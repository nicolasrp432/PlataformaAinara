import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import {
  getConversationMessages,
  listConversations,
  markConversationRead,
} from "@/lib/services/messaging"
import { ConversationsInbox } from "../conversations-inbox"
import { MessagesThread } from "./messages-thread"

interface PageProps {
  params: Promise<{ conversationId: string }>
}

export const metadata = { title: "Conversación | Plataforma Ainara" }

export default async function ConversationPage({ params }: PageProps) {
  const { conversationId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // 1. Cargar mensajes del hilo
  const [messages, conversations] = await Promise.all([
    getConversationMessages(conversationId, user.id),
    listConversations(user.id),
  ])

  if (messages === null) notFound()

  // 2. Obtener información del otro participante
  const client = supabase

  const { data: participants } = await client
    .from("conversation_participants")
    .select("user_id, last_read_at, profiles:member_profiles(id, full_name, avatar_url)")
    .eq("conversation_id", conversationId)
    .neq("user_id", user.id)
    .limit(1)

  const rawProfiles = participants?.[0]?.profiles
  const otherProfile = (Array.isArray(rawProfiles) ? rawProfiles[0] : rawProfiles) as {
    id: string
    full_name: string
    avatar_url: string | null
  } | null

  const other = otherProfile
    ? {
        ...otherProfile,
        last_read_at: participants?.[0]?.last_read_at ?? null,
      }
    : null

  // 3. Marcar como leído al abrir
  await markConversationRead(conversationId, user.id)

  const safeMessages = (messages ?? []).map((m) => {
    const rawP = (m as Record<string, unknown>).profiles
    const profiles = (Array.isArray(rawP) ? rawP[0] : rawP) as {
      id: string
      full_name: string
      avatar_url: string | null
    } | null
    return {
      id: m.id as string,
      sender_id: m.sender_id as string,
      body: m.body as string,
      created_at: m.created_at as string,
      profiles,
    }
  })

  return (
    <div className="messaging-workspace flex overflow-hidden max-w-7xl mx-auto ">
      {/* Columna Izquierda: Lista de conversaciones (visible en escritorio; oculta en móvil para dar foco al chat) */}
      <div className="hidden md:block md:w-[380px] lg:w-[420px] h-full shrink-0">
        <ConversationsInbox
          initialConversations={conversations}
          currentUserId={user.id}
          activeConversationId={conversationId}
        />
      </div>

      {/* Columna Derecha: Hilo de chat activo (ocupa 100% en móvil y el resto en escritorio) */}
      <div className="flex-1 w-full h-full overflow-hidden flex flex-col bg-background/50">
        <MessagesThread key={conversationId}
          conversationId={conversationId}
          currentUserId={user.id}
          otherUser={other}
          initialMessages={safeMessages}
        />
      </div>
    </div>
  )
}
