"use client"

import * as React from "react"
import { Bell } from "lucide-react"
import { NotificationsPanel } from "./notifications-panel"
import { useNotifications } from "./notifications-provider"

interface NotificationsBellProps {
  userId: string
  isCollapsed?: boolean
  /** Dirección en la que se despliega el panel. Por defecto hacia arriba (sidebar). */
  placement?: "top" | "bottom"
}

export function NotificationsBell({ userId, isCollapsed, placement = "top" }: NotificationsBellProps) {
  // El contador y la suscripción Realtime viven en NotificationsProvider: este
  // componente se renderiza a la vez en el sidebar y en la cabecera móvil, y
  // dos suscripciones al mismo topic rompen el cliente de Supabase.
  const { unreadTotal: unreadCount, decrementUnread, clearUnread } = useNotifications()
  const [panelOpen, setPanelOpen] = React.useState(false)

  if (isCollapsed) {
    return (
      <div className="relative w-full">
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="w-full min-h-11 h-9 md:min-h-0 rounded-lg flex items-center justify-center hover:bg-sidebar-accent/50 transition-colors text-muted-foreground hover:text-foreground relative"
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
            placement={placement}
            onClose={() => setPanelOpen(false)}
            onRead={decrementUnread}
            onReadAll={clearUnread}
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
          placement={placement}
          onClose={() => setPanelOpen(false)}
          onRead={decrementUnread}
          onReadAll={clearUnread}
        />
      )}
    </div>
  )
}
