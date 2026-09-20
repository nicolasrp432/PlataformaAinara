"use client"

import * as React from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Mail, Search, Inbox } from "lucide-react"
import { getInitials, cn } from "@/lib/utils"
import { NewMessageDialog } from "./new-message-dialog"

export interface ConversationItem {
  conversationId: string
  otherUser: {
    id: string
    full_name: string
    avatar_url: string | null
  } | null
  lastMessage: {
    body: string
    created_at: string
    sender_id: string
  } | null
  unreadCount: number
  lastMessageAt: string | null
}

interface ConversationsInboxProps {
  initialConversations: ConversationItem[]
  currentUserId: string
  activeConversationId?: string
}

function formatRelativeTime(dateStr?: string | null) {
  if (!dateStr) return ""
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Ahora"
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return "Ayer"
  if (days < 7) return `${days}d`
  return new Date(dateStr).toLocaleDateString("es-ES", {
    month: "short",
    day: "numeric",
  })
}

export function ConversationsInbox({
  initialConversations,
  currentUserId,
  activeConversationId,
}: ConversationsInboxProps) {
  const [conversations, setConversations] =
    React.useState<ConversationItem[]>(initialConversations)
  const [search, setSearch] = React.useState("")

  // Sincronizar si cambian las props iniciales
  React.useEffect(() => {
    setConversations(initialConversations)
  }, [initialConversations])

  // Realtime: Escuchar mensajes y actualizaciones de conversaciones
  React.useEffect(() => {
    const supabase = createClient()

    // 1. Canal de difusión personal
    const personalChannel = supabase.channel(`inbox:${currentUserId}`)

    personalChannel
      .on("broadcast", { event: "direct_message" }, (event) => {
        const payload = event.payload as {
          conversationId: string
          senderId: string
          senderName: string
          senderAvatar?: string | null
          body: string
        }

        setConversations((prev) => {
          const existingIdx = prev.findIndex(
            (c) => c.conversationId === payload.conversationId
          )
          const now = new Date().toISOString()
          const isActive = activeConversationId === payload.conversationId

          if (existingIdx !== -1) {
            const updated = [...prev]
            const target = updated[existingIdx]
            updated[existingIdx] = {
              ...target,
              lastMessage: {
                body: payload.body,
                created_at: now,
                sender_id: payload.senderId,
              },
              lastMessageAt: now,
              unreadCount: isActive ? 0 : target.unreadCount + 1,
            }
            return updated.sort(
              (a, b) =>
                new Date(b.lastMessageAt ?? 0).getTime() -
                new Date(a.lastMessageAt ?? 0).getTime()
            )
          }

          // Si es una conversación nueva no listada aún
          const newConv: ConversationItem = {
            conversationId: payload.conversationId,
            otherUser: {
              id: payload.senderId,
              full_name: payload.senderName,
              avatar_url: payload.senderAvatar ?? null,
            },
            lastMessage: {
              body: payload.body,
              created_at: now,
              sender_id: payload.senderId,
            },
            unreadCount: isActive ? 0 : 1,
            lastMessageAt: now,
          }
          return [newConv, ...prev]
        })
      })
      .subscribe()

    // 2. Canal de postgres_changes en mensajes para actualizar snippet
    const messagesChannel = supabase
      .channel(`inbox-messages:${currentUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const raw = payload.new as {
            id: string
            conversation_id: string
            sender_id: string
            body: string
            created_at: string
          }

          setConversations((prev) => {
            const idx = prev.findIndex((c) => c.conversationId === raw.conversation_id)
            if (idx === -1) return prev

            const updated = [...prev]
            const current = updated[idx]
            const isActive = activeConversationId === raw.conversation_id
            const isOwn = raw.sender_id === currentUserId

            updated[idx] = {
              ...current,
              lastMessage: {
                body: raw.body,
                created_at: raw.created_at,
                sender_id: raw.sender_id,
              },
              lastMessageAt: raw.created_at,
              unreadCount: isActive || isOwn ? 0 : current.unreadCount + 1,
            }

            return updated.sort(
              (a, b) =>
                new Date(b.lastMessageAt ?? 0).getTime() -
                new Date(a.lastMessageAt ?? 0).getTime()
            )
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(personalChannel)
      supabase.removeChannel(messagesChannel)
    }
  }, [currentUserId, activeConversationId])

  // Filtrado por buscador
  const filteredConversations = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return conversations
    return conversations.filter((c) => {
      const name = c.otherUser?.full_name?.toLowerCase() || ""
      const snippet = c.lastMessage?.body?.toLowerCase() || ""
      return name.includes(q) || snippet.includes(q)
    })
  }, [conversations, search])

  return (
    <div className="flex flex-col h-full bg-card/60 backdrop-blur-md border-r border-border/70 overflow-hidden">
      {/* ── Cabecera de la bandeja ──────────────────────────────────── */}
      <div className="p-4 border-b border-border/60 shrink-0 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gold-gradient shadow-md shadow-black/10">
              <Mail className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-foreground tracking-tight">
                Mensajes
              </h1>
              <p className="text-3xs text-muted-foreground leading-tight">
                {conversations.length}{" "}
                {conversations.length === 1 ? "conversación activa" : "conversaciones activas"}
              </p>
            </div>
          </div>
          <NewMessageDialog currentUserId={currentUserId} />
        </div>

        {/* Buscador de chats */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por persona o mensaje…"
            className="h-9 pl-8.5 pr-3 text-xs rounded-xl bg-background/50 border-border/60 focus-visible:ring-primary/20"
          />
        </div>
      </div>

      {/* ── Lista de conversaciones con scroll ──────────────────────── */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/30 px-2 py-1.5 space-y-0.5">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-muted-foreground space-y-3">
            <div className="h-11 w-11 rounded-2xl bg-muted/50 flex items-center justify-center">
              <Inbox className="h-5 w-5 opacity-40 text-primary" />
            </div>
            {search.trim() ? (
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Sin resultados para &ldquo;{search}&rdquo;
                </p>
                <p className="text-3xs text-muted-foreground mt-0.5">
                  Prueba buscando por otro nombre o limpia el filtro.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold text-foreground">
                  No tienes conversaciones todavía
                </p>
                <p className="text-3xs text-muted-foreground mt-0.5 max-w-[200px] mx-auto leading-relaxed">
                  Inicia un chat desde el botón &ldquo;Nuevo mensaje&rdquo; o visitando el perfil de otro explorador.
                </p>
              </div>
            )}
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = activeConversationId === conv.conversationId
            return (
              <Link
                key={conv.conversationId}
                href={`/messages/${conv.conversationId}`}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-all duration-150 relative group",
                  isSelected
                    ? "bg-primary/10 border border-primary/25 shadow-xs"
                    : "hover:bg-muted/50 border border-transparent hover:border-border/40"
                )}
              >
                {/* Avatar con fallback */}
                <div className="relative shrink-0">
                  <Avatar className="h-11 w-11 ring-1 ring-border/80 group-hover:ring-primary/40 transition-colors">
                    <AvatarImage src={conv.otherUser?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                      {getInitials(conv.otherUser?.full_name ?? "?")}
                    </AvatarFallback>
                  </Avatar>
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-3xs font-bold text-primary-foreground shadow-xs ring-2 ring-background">
                      {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                    </span>
                  )}
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span
                      className={cn(
                        "text-sm truncate leading-tight",
                        isSelected || conv.unreadCount > 0
                          ? "font-bold text-foreground"
                          : "font-semibold text-foreground/90"
                      )}
                    >
                      {conv.otherUser?.full_name ?? "Explorador"}
                    </span>
                    {conv.lastMessageAt && (
                      <span className="text-3xs text-muted-foreground shrink-0 font-medium">
                        {formatRelativeTime(conv.lastMessageAt)}
                      </span>
                    )}
                  </div>

                  {conv.lastMessage ? (
                    <p
                      className={cn(
                        "text-xs truncate leading-snug",
                        conv.unreadCount > 0
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {conv.lastMessage.sender_id === currentUserId ? "Tú: " : ""}
                      {conv.lastMessage.body}
                    </p>
                  ) : (
                    <p className="text-xs text-primary/80 italic truncate leading-snug">
                      Conversación iniciada
                    </p>
                  )}
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
