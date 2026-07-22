"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

// Cuenta notificaciones new_message sin leer. Se apoya en notifications (RLS
// propia + ya publicada en Realtime para la campana) en lugar de recorrer
// conversaciones desde el cliente.
export function MessagesUnreadBadge({
  userId,
  isCollapsed,
}: {
  userId: string
  isCollapsed?: boolean
}) {
  const [count, setCount] = React.useState(0)

  React.useEffect(() => {
    const supabase = createClient()

    const fetchCount = async () => {
      const { count: unread } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("kind", "new_message")
        .is("read_at", null)
      setCount(unread ?? 0)
    }

    fetchCount()

    const channel = supabase
      .channel(`messages-unread:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => fetchCount()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  if (count === 0) return null

  if (isCollapsed) {
    return (
      <span className="absolute top-1 right-1 z-10 h-2 w-2 rounded-full bg-primary ring-2 ring-sidebar" />
    )
  }

  return (
    <span
      className={cn(
        "relative z-10 ml-auto flex h-5 min-w-5 items-center justify-center",
        "rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground"
      )}
    >
      {count > 9 ? "9+" : count}
    </span>
  )
}
