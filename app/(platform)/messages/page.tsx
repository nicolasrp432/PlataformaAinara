import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { listConversations } from "@/lib/services/messaging"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { MessageSquare, Inbox } from "lucide-react"
import { getInitials } from "@/lib/utils"

export const metadata = { title: "Mensajes | Μήτρα" }

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Ahora"
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const conversations = await listConversations(user.id)

  return (
    <div className="mx-auto max-w-lg py-6 px-4">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Mensajes</h1>
      </div>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Inbox className="h-10 w-10 opacity-30" />
          <p className="text-sm">No tienes conversaciones todavía.</p>
          <p className="text-xs opacity-70">
            Visita el perfil de otro usuario para iniciar un chat.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {conversations.map((conv) => (
            <Link
              key={conv.conversationId}
              href={`/messages/${conv.conversationId}`}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50"
            >
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={conv.otherUser?.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs">
                  {getInitials(conv.otherUser?.full_name ?? "?")}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-sm font-semibold truncate">
                    {conv.otherUser?.full_name ?? "Usuario"}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {conv.unreadCount > 0 && (
                      <Badge className="h-5 min-w-5 px-1 text-[10px] font-bold rounded-full bg-primary">
                        {conv.unreadCount}
                      </Badge>
                    )}
                    {conv.lastMessageAt && (
                      <span className="text-[10px] text-muted-foreground">
                        {formatRelative(conv.lastMessageAt)}
                      </span>
                    )}
                  </div>
                </div>
                {conv.lastMessage && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {conv.lastMessage.sender_id === user.id ? "Tú: " : ""}
                    {conv.lastMessage.body}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
