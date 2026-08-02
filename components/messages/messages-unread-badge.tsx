"use client"

import { cn } from "@/lib/utils"
import { useNotifications } from "@/components/notifications/notifications-provider"

/**
 * Contador de mensajes sin leer. El número y la suscripción Realtime vienen de
 * NotificationsProvider: este badge se renderiza a la vez en el sidebar, en el
 * botón "Más" de la barra inferior y en la hoja de navegación, y cada instancia
 * con su propio canal rompía el cliente de Supabase.
 */
export function MessagesUnreadBadge({ isCollapsed }: { isCollapsed?: boolean }) {
  const { unreadMessages: count } = useNotifications()

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
