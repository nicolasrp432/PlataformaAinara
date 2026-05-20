"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { X, CheckCheck, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { markNotificationRead, markAllNotificationsRead } from "./actions"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  kind: string
  title: string
  body: string | null
  link: string | null
  read_at: string | null
  created_at: string
}

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Ahora"
  if (mins < 60) return `Hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Hace ${hours}h`
  const days = Math.floor(hours / 24)
  return `Hace ${days}d`
}

interface NotificationsPanelProps {
  userId: string
  onClose: () => void
  onRead: () => void
  onReadAll: () => void
}

export function NotificationsPanel({ userId, onClose, onRead, onReadAll }: NotificationsPanelProps) {
  const router = useRouter()
  const [items, setItems] = React.useState<Notification[]>([])
  const [loading, setLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [hasMore, setHasMore] = React.useState(false)
  const PAGE_SIZE = 15

  const fetchNotifications = React.useCallback(async (pageNum: number) => {
    const supabase = createClient()
    const from = (pageNum - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data } = await supabase
      .from("notifications")
      .select("id, kind, title, body, link, read_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to)

    const rows = data ?? []
    setItems((prev) => pageNum === 1 ? rows : [...prev, ...rows])
    setHasMore(rows.length === PAGE_SIZE)
    setLoading(false)
  }, [userId])

  React.useEffect(() => { fetchNotifications(1) }, [fetchNotifications])

  // Cerrar con Escape
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  const handleClickItem = async (item: Notification) => {
    if (!item.read_at) {
      await markNotificationRead(item.id)
      setItems((prev) => prev.map((n) => n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n))
      onRead()
    }
    onClose()
    if (item.link) router.push(item.link)
  }

  const handleMarkAll = async () => {
    await markAllNotificationsRead()
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
    onReadAll()
  }

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchNotifications(next)
  }

  return (
    <>
      {/* Overlay para cerrar al click fuera */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className={cn(
        "absolute bottom-full left-0 z-50 mb-2 w-80 rounded-xl border border-border bg-card shadow-xl",
        "flex flex-col max-h-[480px]"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Notificaciones</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleMarkAll}
              title="Marcar todo como leído"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Cargando…
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
              <Bell className="h-8 w-8 opacity-30" />
              <span className="text-sm">Sin notificaciones</span>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleClickItem(item)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-border/50 last:border-0",
                    "hover:bg-muted/50 transition-colors",
                    !item.read_at && "bg-primary/5"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!item.read_at && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                    <div className={cn("flex-1 min-w-0", item.read_at && "pl-4")}>
                      <p className="text-sm font-medium leading-snug line-clamp-2">{item.title}</p>
                      {item.body && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{item.body}</p>
                      )}
                      <p className="mt-1 text-[10px] text-muted-foreground/70">
                        {formatRelative(item.created_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
              {hasMore && (
                <button
                  type="button"
                  onClick={loadMore}
                  className="w-full py-3 text-center text-xs text-primary hover:underline"
                >
                  Cargar más
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
