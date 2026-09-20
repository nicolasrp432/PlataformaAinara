"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { playMessageChime } from "@/components/messages/audio-chime"

interface NotificationsContextValue {
  /** No leídas de cualquier tipo (campana). */
  unreadTotal: number
  /** No leídas de tipo `new_message` (badge de Mensajes). */
  unreadMessages: number
  refresh: () => void
  decrementUnread: () => void
  clearUnread: () => void
  broadcastDirectMessage: (
    recipientId: string,
    data: {
      conversationId: string
      senderName: string
      senderAvatar?: string | null
      body: string
    }
  ) => void
}

const FALLBACK: NotificationsContextValue = {
  unreadTotal: 0,
  unreadMessages: 0,
  refresh: () => {},
  decrementUnread: () => {},
  clearUnread: () => {},
  broadcastDirectMessage: () => {},
}

const NotificationsContext = React.createContext<NotificationsContextValue | null>(null)

export function NotificationsProvider({
  userId,
  children,
}: {
  userId: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const [unreadTotal, setUnreadTotal] = React.useState(0)
  const [unreadMessages, setUnreadMessages] = React.useState(0)
  const channelRef = React.useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(
    null
  )

  const refresh = React.useCallback(async () => {
    const supabase = createClient()
    const base = () =>
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("read_at", null)

    const [total, messages] = await Promise.all([
      base(),
      base().or("kind.eq.new_message,link.ilike.%/messages/%"),
    ])

    setUnreadTotal(total.count ?? 0)
    setUnreadMessages(messages.count ?? 0)
  }, [userId])

  React.useEffect(() => {
    refresh()

    const supabase = createClient()
    const channel = supabase.channel(`user:${userId}:global`, {
      config: { broadcast: { self: false } },
    })

    channelRef.current = channel

    // 1. Escuchar cambios de PostgreSQL en notifications para este usuario
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        refresh()
        const row = payload.new as {
          title?: string
          body?: string
          link?: string
          kind?: string
        }

        // Si es un nuevo mensaje, alertar con sonido y toast
        if (row.kind === "new_message" || (row.link && row.link.includes("/messages/"))) {
          playMessageChime()
          toast(row.title || "Nuevo mensaje recibido", {
            description: row.body ? `«${row.body}»` : undefined,
            action: row.link
              ? {
                  label: "Ver chat",
                  onClick: () => router.push(row.link!),
                }
              : undefined,
          })
        }
      }
    )

    // 2. Escuchar broadcast instantáneo de mensajes directos
    channel.on(
      "broadcast",
      { event: "direct_message" },
      (event) => {
        const data = event.payload as {
          conversationId: string
          senderName: string
          senderAvatar?: string | null
          body: string
        }
        refresh()
        playMessageChime()

        toast(`${data.senderName} te ha enviado un mensaje`, {
          description: `«${data.body.slice(0, 80)}»`,
          action: {
            label: "Responder",
            onClick: () => router.push(`/messages/${data.conversationId}`),
          },
        })
      }
    )

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, refresh, router])

  // Difundir un mensaje directo en tiempo real al canal del destinatario
  const broadcastDirectMessage = React.useCallback(
    (
      recipientId: string,
      data: {
        conversationId: string
        senderName: string
        senderAvatar?: string | null
        body: string
      }
    ) => {
      try {
        const supabase = createClient()
        const targetChannel = supabase.channel(`user:${recipientId}:global`)
        targetChannel.subscribe((status) => {
          if (status === "SUBSCRIBED") {
            targetChannel.send({
              type: "broadcast",
              event: "direct_message",
              payload: data,
            })
          }
        })
      } catch {
        // Fallback silencioso; la notificación en base de datos ya está en curso
      }
    },
    []
  )

  const decrementUnread = React.useCallback(() => {
    setUnreadTotal((n) => Math.max(0, n - 1))
  }, [])

  const clearUnread = React.useCallback(() => {
    setUnreadTotal(0)
    setUnreadMessages(0)
  }, [])

  const value = React.useMemo<NotificationsContextValue>(
    () => ({
      unreadTotal,
      unreadMessages,
      refresh,
      decrementUnread,
      clearUnread,
      broadcastDirectMessage,
    }),
    [unreadTotal, unreadMessages, refresh, decrementUnread, clearUnread, broadcastDirectMessage]
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications(): NotificationsContextValue {
  return React.useContext(NotificationsContext) ?? FALLBACK
}
