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

}

const FALLBACK: NotificationsContextValue = {
  unreadTotal: 0,
  unreadMessages: 0,
  refresh: () => {},
  decrementUnread: () => {},
  clearUnread: () => {},
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
    const channel = supabase.channel(`notifications:${userId}`)

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
          id?: string
          title?: string
          body?: string
          link?: string
          kind?: string
        }

        // Si es un nuevo mensaje, alertar con sonido y toast
        if (row.kind === "new_message" || (row.link && row.link.includes("/messages/"))) {
          if (document.visibilityState === "visible" && window.location.pathname === row.link) {
            if (row.id) supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id",row.id).eq("user_id",userId).then(() => refresh())
            return
          }
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

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, refresh, router])

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
    }),
    [unreadTotal, unreadMessages, refresh, decrementUnread, clearUnread]
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications(): NotificationsContextValue {
  return React.useContext(NotificationsContext) ?? FALLBACK
}
