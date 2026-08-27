"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
  CreditCard,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Settings,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SPRING_UI } from "@/lib/motion"
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
 * Navegación móvil de lujo (Floating Dock).
 * Diseño táctil optimizado para la ergonomía del pulgar, acristalado cálido (glassmorphism),
 * microanimaciones elásticas y hoja expandida enriquecida.
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

  // En rutas inmersivas (ej. reproductor de lección) se usa la barra de la lección
  if (isImmersiveRoute(pathname)) return null

  return (
    <>
      <nav
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 md:hidden pointer-events-none",
          "px-3 pb-2 pt-1 safe-bottom"
        )}
        aria-label="Navegación principal"
      >
        <div
          data-translucent=""
          className="pointer-events-auto mx-auto max-w-md rounded-2xl border border-border/80 bg-card/90 shadow-[0_8px_32px_rgba(246,210,92,0.12),0_2px_12px_rgba(0,0,0,0.08)] backdrop-blur-2xl px-1.5 py-1">
          <div className="grid grid-cols-5 items-center">
            {MOBILE_PRIMARY_NAV.map((item) => {
              const isActive = isNavItemActive(pathname, item.href)
              const isReflexion = item.href === "/reflexion"

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-xl py-1",
                    "touch-manipulation transition-[transform,color] duration-100 ease-out active:scale-[0.94]",
                    isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="mobile-nav-pill"
                      className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20"
                      transition={SPRING_UI}
                    />
                  )}

                  {isReflexion ? (
                    <div
                      className={cn(
                        "relative z-10 flex h-7 w-7 items-center justify-center rounded-lg transition-transform",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                          : "bg-primary/15 text-primary"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                    </div>
                  ) : (
                    <item.icon
                      className={cn(
                        "relative z-10 h-5 w-5 transition-transform",
                        isActive && "scale-110 text-primary"
                      )}
                    />
                  )}

                  <span className="relative z-10 text-3xs tracking-tight leading-none">
                    {item.shortName ?? item.name}
                  </span>
                </Link>
              )
            })}

            {/* Botón 'Más' con indicador de mensajes */}
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-label="Más opciones y herramientas"
              className={cn(
                "relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-xl py-1",
                "touch-manipulation transition-[transform,color] duration-100 ease-out active:scale-[0.94]",
                isMoreActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isMoreActive && (
                <motion.span
                  layoutId="mobile-nav-pill"
                  className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20"
                  transition={SPRING_UI}
                />
              )}
              <span className="relative z-10">
                <MoreHorizontal className="h-5 w-5" />
                <MessagesUnreadBadge isCollapsed />
              </span>
              <span className="relative z-10 text-3xs tracking-tight leading-none">
                Más
              </span>
            </button>
          </div>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[88dvh] rounded-t-3xl border-t border-border/80 bg-card/95 backdrop-blur-2xl"
          contentClassName="px-5 pb-8"
        >
          <SheetHeader className="pb-2">
            <SheetTitle className="text-left font-display text-lg font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Explorar Plataforma
            </SheetTitle>
          </SheetHeader>

          {/* Tarjeta de resumen de usuario con nivel y XP */}
          <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-3.5 shadow-sm">
            <Avatar className="h-12 w-12 shrink-0 ring-2 ring-primary/30">
              <AvatarImage src={user.avatarUrl || undefined} alt={user.full_name} />
              <AvatarFallback className="bg-primary/15 text-sm font-semibold text-primary">
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold text-foreground">
                  {user.full_name}
                </p>
                <span className="shrink-0 rounded-full bg-primary/20 px-2 py-0.5 text-2xs font-bold text-primary">
                  Nivel {liveLevel}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {liveXp.toLocaleString()} XP · {streak} {streak === 1 ? "día de racha" : "días de racha"}
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted/80">
                <div
                  className="h-full rounded-full gold-gradient transition-[width] duration-500 ease-out"
                  style={{ width: `${Math.round(progress)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Grid de módulos secundarios */}
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {MOBILE_SECONDARY_NAV.map((item) => {
              const isActive = isNavItemActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "relative flex min-h-[78px] flex-col items-center justify-center gap-2 rounded-2xl border p-2.5 text-center",
                    "touch-manipulation transition-[transform,background-color,border-color] duration-100 ease-out active:scale-[0.96]",
                    isActive
                      ? "border-primary/50 bg-primary/10 text-foreground shadow-sm shadow-primary/10"
                      : "border-border/60 bg-background/50 text-muted-foreground hover:bg-background/80 hover:text-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                      isActive ? "bg-primary text-primary-foreground" : "bg-muted/80 text-muted-foreground"
                    )}
                  >
                    <item.icon className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-xs font-medium leading-none">{item.name}</span>
                  {item.href === "/messages" && <MessagesUnreadBadge isCollapsed />}
                </Link>
              )
            })}
          </div>

          <div className="gold-divider my-4" />

          {/* Opciones de cuenta y administración */}
          <div className="space-y-1">
            <Link
              href="/profile/settings"
              onClick={() => setMoreOpen(false)}
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              Configuración de la cuenta
            </Link>
            <Link
              href="/billing"
              onClick={() => setMoreOpen(false)}
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
            >
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Suscripción y membresía
            </Link>
            {user.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setMoreOpen(false)}
                className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
              >
                <LayoutDashboard className="h-4 w-4 text-primary" />
                Panel de Administración
              </Link>
            )}
            <Link
              href="/logout"
              onClick={() => setMoreOpen(false)}
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
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
