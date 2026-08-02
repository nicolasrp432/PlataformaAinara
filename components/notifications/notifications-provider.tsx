"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"

/**
 * Suscripción única a `notifications` para todo el layout de plataforma.
 *
 * Antes se suscribían los propios componentes (NotificationsBell y
 * MessagesUnreadBadge). Al añadir la navegación móvil pasaron a renderizarse
 * dos y tres veces a la vez —el sidebar se oculta con CSS pero React lo sigue
 * montando—, y como el cliente de navegador indexa sus canales por nombre de
 * topic, el segundo `supabase.channel("notifications:X")` devolvía el canal ya
 * suscrito y `.on("postgres_changes", …)` lanzaba:
 *
 *   cannot add `postgres_changes` callbacks for realtime:notifications:X
 *   after `subscribe()`
 *
 * Con el canal aquí arriba ningún componente es dueño de una suscripción, así
 * que da igual cuántas veces se rendericen. Además ambos contadores salen del
 * mismo flujo, que era la misma consulta duplicada.
 */

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
  const [unreadTotal, setUnreadTotal] = React.useState(0)
  const [unreadMessages, setUnreadMessages] = React.useState(0)

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
      base().eq("kind", "new_message"),
    ])

    setUnreadTotal(total.count ?? 0)
    setUnreadMessages(messages.count ?? 0)
  }, [userId])

  React.useEffect(() => {
    refresh()

    const supabase = createClient()
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => refresh()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, refresh])

  // Ajustes optimistas para que marcar como leído se sienta inmediato; el
  // UPDATE real llega por Realtime y reconcilia ambos contadores.
  const decrementUnread = React.useCallback(() => {
    setUnreadTotal((n) => Math.max(0, n - 1))
  }, [])

  const clearUnread = React.useCallback(() => {
    setUnreadTotal(0)
    setUnreadMessages(0)
  }, [])

  const value = React.useMemo<NotificationsContextValue>(
    () => ({ unreadTotal, unreadMessages, refresh, decrementUnread, clearUnread }),
    [unreadTotal, unreadMessages, refresh, decrementUnread, clearUnread]
  )

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

/**
 * Fuera del provider devuelve valores neutros en vez de lanzar: un descuido
 * al colocar un componente no debe volver a tumbar la plataforma entera.
 */
export function useNotifications(): NotificationsContextValue {
  return React.useContext(NotificationsContext) ?? FALLBACK
}
