"use client"

import * as React from "react"
import { Bell } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { NotificationsPanel } from "./notifications-panel"

interface NotificationsBellProps {
  userId: string
  isCollapsed?: boolean
}

export function NotificationsBell({ userId, isCollapsed }: NotificationsBellProps) {
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [panelOpen, setPanelOpen] = React.useState(false)

  React.useEffect(() => {
    const supabase = createClient()

    // Carga inicial del count
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null)
      .then(({ count }) => setUnreadCount(count ?? 0))

    // Suscripción Realtime — patrón replicado de taberna-feed.tsx
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => setUnreadCount((n) => n + 1)
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Re-fetch count cuando hay UPDATE (marcado como leído)
          supabase
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .is("read_at", null)
            .then(({ count }) => setUnreadCount(count ?? 0))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  if (isCollapsed) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="w-full h-9 rounded-lg flex items-center justify-center hover:bg-sidebar-accent/50 transition-colors text-muted-foreground hover:text-foreground relative"
          aria-label="Notificaciones"
          title="Notificaciones"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
        {panelOpen && (
          <NotificationsPanel
            userId={userId}
            onClose={() => setPanelOpen(false)}
            onRead={() => setUnreadCount((n) => Math.max(0, n - 1))}
            onReadAll={() => setUnreadCount(0)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setPanelOpen(!panelOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors text-sm text-sidebar-foreground"
      >
        <Bell className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="flex-1 text-left">Notificaciones</span>
        {unreadCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      {panelOpen && (
        <NotificationsPanel
          userId={userId}
          onClose={() => setPanelOpen(false)}
          onRead={() => setUnreadCount((n) => Math.max(0, n - 1))}
          onReadAll={() => setUnreadCount(0)}
        />
      )}
    </div>
  )
}
