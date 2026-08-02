"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Flame } from "lucide-react"
import { isImmersiveRoute } from "@/lib/navigation"
import { BrandMark } from "@/components/ui/brand"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NotificationsBell } from "@/components/notifications/notifications-bell"
import { UserSearch } from "@/components/layout/user-search"
import { getInitials } from "@/lib/utils"

interface MobileTopBarProps {
  user: {
    id: string
    full_name: string
    avatarUrl?: string | null
  }
  streak: number
}

/**
 * Cabecera fija de móvil. Sustituye al botón hamburguesa flotante que obligaba
 * a reservar 80px de padding superior en todas las páginas.
 */
export function MobileTopBar({ user, streak }: MobileTopBarProps) {
  const pathname = usePathname()

  // El visor de lección es pantalla completa y tiene su propia cabecera.
  if (isImmersiveRoute(pathname)) return null

  return (
    <header className="safe-top sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl md:hidden">
      <div className="flex h-14 items-center gap-1 px-3">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2">
          <BrandMark size="sm" />
          <span className="font-display text-lg font-semibold leading-none tracking-wide text-foreground">
            Mitra
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-0.5">
          {streak > 0 && (
            <span className="mr-1 flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2 py-1 text-xs font-semibold text-foreground">
              <Flame className="h-3.5 w-3.5 text-primary" />
              {streak}
            </span>
          )}

          <UserSearch variant="icon" />

          <div className="w-11">
            <NotificationsBell userId={user.id} isCollapsed placement="bottom" />
          </div>

          <Link
            href="/profile"
            aria-label="Mi perfil"
            className="flex h-11 w-11 items-center justify-center"
          >
            <Avatar className="h-8 w-8 ring-2 ring-primary/20">
              <AvatarImage src={user.avatarUrl || undefined} alt={user.full_name} />
              <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  )
}
