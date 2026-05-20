"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LayoutDashboard,
  BookOpen,
  Compass,
  Beer,
  Users,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Flame,
  Star,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  MessageSquare,
  Bot,
} from "lucide-react"
import { getInitials, progressToNextLevel } from "@/lib/utils"
import { SenderoLogo } from "@/components/ui/logo"
import { NotificationsBell } from "@/components/notifications/notifications-bell"

interface SidebarUser {
  id: string
  full_name: string
  email: string
  avatarUrl?: string | null
  role: string
  level: number
  xp: number
}

interface PlatformSidebarProps {
  user: SidebarUser
  streak: number
}

const navigation = [
  { name: "Dashboard",  href: "/dashboard",   icon: LayoutDashboard },
  { name: "Biblioteca", href: "/library",      icon: BookOpen },
  { name: "Quest",      href: "/quest",        icon: Compass },
  { name: "Taberna",    href: "/taberna",      icon: Beer },
  { name: "Mentoría",   href: "/mentorship",   icon: Users },
  { name: "Mensajes",   href: "/messages",     icon: MessageSquare },
  { name: "Asistente",  href: "/assistant",    icon: Bot },
  { name: "Perfil",     href: "/profile",      icon: User },
]

const SIDEBAR_COLLAPSED_KEY = "sendero:sidebar:collapsed"

export function PlatformSidebar({ user, streak }: PlatformSidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [isMobileOpen, setIsMobileOpen] = React.useState(false)
  const [hydrated, setHydrated] = React.useState(false)

  // Persist collapsed state
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
      if (stored === "1") setIsCollapsed(true)
    } catch { /* SSR safe */ }
    setHydrated(true)
  }, [])

  React.useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, isCollapsed ? "1" : "0")
    } catch { /* ignore */ }
  }, [isCollapsed, hydrated])

  const progress = progressToNextLevel(user.xp)

  return (
    <>
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="fixed left-4 top-4 z-50 md:hidden bg-card border border-border shadow-[var(--shadow-sm)] rounded-lg"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* ── SIDEBAR ───────────────────────────────────────────── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col",
          "bg-sidebar border-r border-sidebar-border",
          "shadow-sm",
          "transition-all duration-300 ease-out",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* ── Logo bar ──────────────────────────────────────── */}
        <div className={cn(
          "flex h-16 items-center border-b border-sidebar-border",
          isCollapsed ? "justify-center px-3" : "justify-between px-4"
        )}>
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 min-w-0"
            onClick={() => setIsMobileOpen(false)}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg gold-gradient shadow-sm text-white">
              <SenderoLogo className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <span className="text-base font-bold text-foreground tracking-tight leading-none block">
                  Sendero
                </span>
                <span className="text-[10px] text-muted-foreground tracking-widest uppercase font-medium leading-none">
                  Tu camino
                </span>
              </div>
            )}
          </Link>

          <Button
            variant="ghost"
            size="icon-sm"
            className="hidden md:flex text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </Button>
        </div>

        {/* ── User XP stats ─────────────────────────────────── */}
        {!isCollapsed && (
          <div className="border-b border-sidebar-border p-4">
            <div className="mb-3 flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary">
                  <Flame className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground">{streak}</span>
                <span className="text-xs text-muted-foreground">días</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary">
                  <Star className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground">{user.xp.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">XP</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="label-luxury">Nivel {user.level}</span>
                <span className="text-xs text-muted-foreground font-medium">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full gold-gradient transition-all duration-700 ease-out"
                  style={{ width: `${Math.round(progress)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="border-b border-sidebar-border py-3 flex justify-center">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-secondary border border-border">
              <Star className="h-3.5 w-3.5 text-primary" />
              <svg className="absolute inset-0 h-8 w-8 -rotate-90" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary/15" />
                <circle
                  cx="16" cy="16" r="13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={`${2 * Math.PI * 13}`}
                  strokeDashoffset={`${2 * Math.PI * 13 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  className="text-primary transition-all duration-700"
                />
              </svg>
            </div>
          </div>
        )}

        {/* ── Navigation with animated active pill ─────────────── */}
        <nav className="flex-1 overflow-y-auto overscroll-contain py-3 px-2">
          <div className="space-y-0.5">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname?.startsWith(item.href + "/")

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "relative flex items-center gap-3 rounded-lg px-3 py-2.5",
                    "text-sm font-medium leading-none",
                    "transition-colors duration-150",
                    isCollapsed && "justify-center px-2",
                    isActive
                      ? "text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active-pill"
                      className="absolute inset-0 rounded-lg bg-sidebar-accent ring-1 ring-primary/15 -z-0"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <item.icon
                    className={cn(
                      "h-4.5 w-4.5 shrink-0 relative z-10",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  {!isCollapsed && (
                    <span className="relative z-10">{item.name}</span>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        <div className="gold-divider mx-4 my-0" />

        {/* ── User menu + notif bell ─────────────────────────── */}
        <div className="p-2 pb-3 space-y-1">
          <NotificationsBell userId={user.id} isCollapsed={isCollapsed} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full h-auto py-2.5 px-3 rounded-lg",
                  "hover:bg-sidebar-accent/60",
                  "justify-start gap-3 text-left",
                  isCollapsed && "justify-center px-2 gap-0"
                )}
                aria-label="Menú de usuario"
              >
                <Avatar className="h-8 w-8 shrink-0 ring-2 ring-primary/20">
                  <AvatarImage src={user.avatarUrl || undefined} alt={user.full_name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {getInitials(user.full_name)}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="flex min-w-0 flex-col text-left">
                    <span className="truncate text-sm font-semibold text-foreground leading-tight">
                      {user.full_name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground leading-tight">
                      {user.email}
                    </span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              side="top"
              sideOffset={8}
              className="w-56 rounded-xl border-border shadow-lg"
            >
              <DropdownMenuLabel className="text-base font-semibold">
                Mi cuenta
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4 text-muted-foreground" />
                  Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                  Configuración
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/billing" className="cursor-pointer">
                  <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
                  Suscripción
                </Link>
              </DropdownMenuItem>

              {user.role === "admin" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4 text-muted-foreground" />
                      Panel Admin
                    </Link>
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href="/logout"
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {!isCollapsed && (
            <div className="pt-2 px-3 text-[10px] text-muted-foreground/70 text-center tracking-widest uppercase">
              Sendero · v0.2
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
