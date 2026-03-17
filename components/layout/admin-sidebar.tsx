"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
import { Separator } from "@/components/ui/separator"
import {
  Sparkles,
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Video,
  FileQuestion,
  Award,
  MessageSquare,
} from "lucide-react"
import type { User as UserType } from "@/types"
import { getInitials } from "@/lib/utils"

interface AdminSidebarProps {
  user: UserType | null
}

const mainNavigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Usuarios", href: "/admin/users", icon: Users },
  { name: "Analiticas", href: "/admin/analytics", icon: BarChart3 },
]

const contentNavigation = [
  { name: "Formaciones", href: "/admin/content/formations", icon: BookOpen },
  { name: "Modulos", href: "/admin/content/modules", icon: FolderOpen },
  { name: "Lecciones", href: "/admin/content/lessons", icon: Video },
  { name: "Quizzes", href: "/admin/content/quizzes", icon: FileQuestion },
]

const systemNavigation = [
  { name: "Certificados", href: "/admin/certificates", icon: Award },
  { name: "Comentarios", href: "/admin/comments", icon: MessageSquare },
  { name: "Configuracion", href: "/admin/settings", icon: Settings },
]

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [isMobileOpen, setIsMobileOpen] = React.useState(false)

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin"
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-4 z-50 md:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-sidebar transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            {!isCollapsed && (
              <div>
                <span className="font-bold">Ainara</span>
                <span className="ml-1 text-xs text-muted-foreground">Admin</span>
              </div>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-4 overflow-y-auto p-2">
          {/* Main */}
          <div className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Principal
              </p>
            )}
            {mainNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            ))}
          </div>

          {!isCollapsed && <Separator />}

          {/* Content */}
          <div className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Contenido
              </p>
            )}
            {contentNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            ))}
          </div>

          {!isCollapsed && <Separator />}

          {/* System */}
          <div className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Sistema
              </p>
            )}
            {systemNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            ))}
          </div>
        </nav>

        {/* Back to platform link */}
        <div className="border-t p-2">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-foreground"
            )}
          >
            <ChevronLeft className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Volver a la plataforma</span>}
          </Link>
        </div>

        {/* User menu */}
        <div className="border-t p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar_url || undefined} />
                  <AvatarFallback>
                    {user ? getInitials(user.name) : "?"}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium">
                      {user?.name || "Admin"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Administrador
                    </span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <Users className="mr-2 h-4 w-4" />
                  Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/logout">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesion
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  )
}
