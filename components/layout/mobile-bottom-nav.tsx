"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { CreditCard, LayoutDashboard, LogOut, MoreHorizontal, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials, progressToNextLevel } from "@/lib/utils"
import { useUserStore } from "@/lib/store/user-store"
import { MessagesUnreadBadge } from "@/components/messages/messages-unread-badge"
import {
  MOBILE_PRIMARY_NAV,
  MOBILE_SECONDARY_NAV,
  isImmersiveRoute,
  isNavItemActive,
} from "@/lib/navigation"

interface MobileBottomNavProps {
  user: {
    id: string
    full_name: string
    email: string
    avatarUrl?: string | null
    role: string
    level: number
    xp: number
  }
  streak: number
}

/**
 * Navegación principal en móvil. Sustituye al drawer + hamburguesa flotante:
 * cuatro destinos siempre a la vista y una hoja "Más" con el resto.
 * Se oculta por completo a partir de `md`, donde manda el sidebar.
 */
export function MobileBottomNav({ user, streak }: MobileBottomNavProps) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = React.useState(false)
  const { state: storeState } = useUserStore()

  const liveXp = storeState.xp > 0 ? storeState.xp : user.xp
  const liveLevel = storeState.level > 0 ? storeState.level : user.level
  const progress = progressToNextLevel(liveXp)

  const isMoreActive = MOBILE_SECONDARY_NAV.some((item) =>
    isNavItemActive(pathname, item.href)
  )

  // El visor de lección trae su propia barra inferior: dos barras superpuestas.
  if (isImmersiveRoute(pathname)) return null

  return (
    <>
      <nav
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 md:hidden",
          "border-t border-border/70 bg-card/95 backdrop-blur-xl",
          "shadow-[0_-4px_24px_-12px_rgba(0,0,0,0.25)]",
          "safe-bottom"
        )}
        aria-label="Navegación principal"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {MOBILE_PRIMARY_NAV.map((item) => {
            const isActive = isNavItemActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2",
                  "transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="mobile-nav-active"
                    className="absolute inset-x-2 inset-y-1 -z-0 rounded-xl bg-primary/10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <item.icon className="relative z-10 h-5 w-5" />
                <span className="relative z-10 text-[11px] font-medium leading-none">
                  {item.shortName ?? item.name}
                </span>
              </Link>
            )
          })}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-label="Más opciones"
            className={cn(
              "relative flex min-h-14 flex-col items-center justify-center gap-1 px-1 py-2",
              "transition-colors",
              isMoreActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            {isMoreActive && (
              <motion.span
                layoutId="mobile-nav-active"
                className="absolute inset-x-2 inset-y-1 -z-0 rounded-xl bg-primary/10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">
              <MoreHorizontal className="h-5 w-5" />
              <MessagesUnreadBadge isCollapsed />
            </span>
            <span className="relative z-10 text-[11px] font-medium leading-none">
              Más
            </span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="max-h-[88dvh] gap-0 px-4 pb-6">
          <SheetHeader className="pb-1">
            <SheetTitle className="sr-only">Menú</SheetTitle>
          </SheetHeader>

          {/* Resumen del usuario */}
          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/50 p-3">
            <Avatar className="h-11 w-11 shrink-0 ring-2 ring-primary/20">
              <AvatarImage src={user.avatarUrl || undefined} alt={user.full_name} />
              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight text-foreground">
                {user.full_name}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Nivel {liveLevel} · {liveXp.toLocaleString()} XP · {streak}{" "}
                {streak === 1 ? "día" : "días"}
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full gold-gradient transition-all duration-700"
                  style={{ width: `${Math.round(progress)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {MOBILE_SECONDARY_NAV.map((item) => {
              const isActive = isNavItemActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "relative flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border p-2 text-center transition-colors",
                    isActive
                      ? "border-primary/40 bg-primary/10 text-foreground"
                      : "border-border/60 bg-background/40 text-muted-foreground"
                  )}
                >
                  <item.icon
                    className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")}
                  />
                  <span className="text-xs font-medium leading-none">{item.name}</span>
                  {item.href === "/messages" && (
                    <MessagesUnreadBadge isCollapsed />
                  )}
                </Link>
              )
            })}
          </div>

          <div className="gold-divider my-4" />

          <div className="space-y-1">
            <Link
              href="/profile/settings"
              onClick={() => setMoreOpen(false)}
              className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium text-foreground"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              Configuración
            </Link>
            <Link
              href="/billing"
              onClick={() => setMoreOpen(false)}
              className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium text-foreground"
            >
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Suscripción
            </Link>
            {user.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setMoreOpen(false)}
                className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium text-foreground"
              >
                <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                Panel Admin
              </Link>
            )}
            <Link
              href="/logout"
              onClick={() => setMoreOpen(false)}
              className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
