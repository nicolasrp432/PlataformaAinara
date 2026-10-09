"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  FolderOpen,
  Video,
  FileQuestion,
  Award,
  MessageSquare,
  Bell,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BrandMark } from "@/components/ui/brand";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, cn } from "@/lib/utils";

const groups = [
  {
    label: "Plataforma",
    items: [
      { name: "Resumen", href: "/admin", icon: LayoutDashboard },
      { name: "Usuarios", href: "/admin/users", icon: Users },
      { name: "Analíticas", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Contenido",
    items: [
      {
        name: "Formaciones",
        href: "/admin/content/formations",
        icon: BookOpen,
      },
      { name: "Módulos", href: "/admin/content/modules", icon: FolderOpen },
      { name: "Lecciones", href: "/admin/content/lessons", icon: Video },
      { name: "Quizzes", href: "/admin/content/quizzes", icon: FileQuestion },
    ],
  },
  {
    label: "Gestión",
    items: [
      {
        name: "Agenda de mentoría",
        href: "/admin/mentorship",
        icon: CalendarDays,
      },
      { name: "Certificados", href: "/admin/certificates", icon: Award },
      { name: "Notificaciones", href: "/admin/notifications", icon: Bell },
      { name: "Comentarios", href: "/admin/comments", icon: MessageSquare },
      { name: "Testimonios", href: "/admin/testimonials", icon: Video },
      { name: "Configuración", href: "/admin/settings", icon: Settings },
    ],
  },
];
interface AdminSidebarProps {
  user: {
    id: string;
    full_name: string;
    email: string;
    avatarUrl?: string | null;
    role: string;
  };
}
export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--admin-sidebar-w",
      collapsed ? "5rem" : "16rem",
    );
    return () => {
      document.documentElement.style.removeProperty("--admin-sidebar-w");
    };
  }, [collapsed]);
  const navigation = (compact: boolean) => (
    <nav
      aria-label="Administración"
      className="flex-1 space-y-6 overflow-y-auto p-3"
    >
      {groups.map((group) => (
        <div key={group.label}>
          <p
            className={cn(
              "mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground",
              compact && "sr-only",
            )}
          >
            {group.label}
          </p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === item.href
                  : pathname?.startsWith(item.href + "/") ||
                    pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={active ? "page" : undefined}
                  aria-label={compact ? item.name : undefined}
                  title={compact ? item.name : undefined}
                  className={cn(
                    "admin-nav-link",
                    active && "admin-nav-active",
                    compact && "justify-center",
                  )}
                >
                  <item.icon size={18} className="shrink-0" />
                  {!compact && <span>{item.name}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
  const account = (compact: boolean) => (
    <div className="space-y-3 border-t p-3">
      <Link
        href="/dashboard"
        className={cn(
          "admin-nav-link text-muted-foreground",
          compact && "justify-center",
        )}
        aria-label={compact ? "Volver a la plataforma" : undefined}
      >
        <BookOpen size={18} className="shrink-0" />
        {!compact && "Volver a mi espacio"}
      </Link>
      <div
        className={cn(
          "flex items-center gap-3 px-2",
          compact && "justify-center",
        )}
      >
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={user.avatarUrl || undefined} alt={user.full_name} />
          <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
        </Avatar>
        {!compact && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user.full_name}</p>
            <p className="text-xs text-muted-foreground">Administración</p>
          </div>
        )}
        <Link
          href="/logout"
          aria-label="Cerrar sesión"
          className={cn(
            "ml-auto rounded-lg p-2 text-muted-foreground hover:bg-muted",
            compact && "hidden",
          )}
        >
          <LogOut size={16} />
        </Link>
      </div>
      {compact && (
        <Link
          href="/logout"
          aria-label="Cerrar sesión"
          className="admin-nav-link justify-center"
        >
          <LogOut size={18} />
        </Link>
      )}
    </div>
  );
  return (
    <>
      <header className="admin-mobile-header">
        <Link href="/admin" className="flex items-center gap-2">
          <BrandMark />
          <span className="font-display text-xl">
            Mitra{" "}
            <span className="text-sm font-sans text-muted-foreground">
              / Admin
            </span>
          </span>
        </Link>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="Abrir navegación de administración"
            >
              <Menu size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[min(20rem,90vw)]"
            contentClassName="p-0"
          >
            <SheetTitle className="px-6 pt-6 font-display">
              Administración
            </SheetTitle>
            <SheetDescription className="sr-only">
              Navegación y gestión de Mitra.
            </SheetDescription>
            {navigation(false)}
            {account(false)}
          </SheetContent>
        </Sheet>
      </header>
      <aside
        className={cn(
          "ainara-admin-sidebar fixed inset-y-0 left-0 z-40 hidden flex-col border-r md:flex",
          collapsed ? "w-20" : "w-64",
        )}
      >
        <div
          className={cn(
            "flex h-24 items-center border-b px-4",
            collapsed ? "justify-center" : "gap-3",
          )}
        >
          <Link href="/admin" aria-label="Resumen de administración">
            <BrandMark />
          </Link>
          {!collapsed && (
            <div>
              <p className="font-display text-xl">Mitra</p>
              <p className="text-xs text-muted-foreground">Administración</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          className="mx-3 my-2"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {collapsed ? (
            <PanelLeftOpen size={18} />
          ) : (
            <>
              <PanelLeftClose size={18} />
              <span>Reducir menú</span>
            </>
          )}
        </Button>
        {navigation(collapsed)}
        {account(collapsed)}
      </aside>
    </>
  );
}
