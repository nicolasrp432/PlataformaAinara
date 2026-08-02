import {
  LayoutDashboard,
  BookOpen,
  Users,
  User,
  MessageSquare,
  Mail,
  Bot,
  Trophy,
  NotebookPen,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  /** Etiqueta corta para la barra inferior móvil, donde el ancho es escaso */
  shortName?: string
}

/**
 * Navegación principal de la plataforma. Fuente única para el sidebar de
 * escritorio y para la barra inferior + hoja "Más" de móvil.
 */
export const PLATFORM_NAV: NavItem[] = [
  { name: "Dashboard",  href: "/dashboard",   icon: LayoutDashboard, shortName: "Inicio" },
  { name: "Biblioteca", href: "/library",     icon: BookOpen },
  { name: "Reflexión",  href: "/reflexion",   icon: NotebookPen },
  { name: "Logros",     href: "/quest",       icon: Trophy },
  { name: "Comunidad",  href: "/taberna",     icon: MessageSquare },
  { name: "Mensajes",   href: "/messages",    icon: Mail },
  { name: "Mentoría",   href: "/mentorship",  icon: Users },
  { name: "Asistente",  href: "/assistant",   icon: Bot },
  { name: "Perfil",     href: "/profile",     icon: User },
]

/** Los cuatro destinos que viven en la barra inferior; el resto va en "Más". */
export const MOBILE_PRIMARY_HREFS = [
  "/dashboard",
  "/library",
  "/reflexion",
  "/taberna",
] as const

export const MOBILE_PRIMARY_NAV: NavItem[] = MOBILE_PRIMARY_HREFS.map(
  (href) => PLATFORM_NAV.find((item) => item.href === href)!
)

export const MOBILE_SECONDARY_NAV: NavItem[] = PLATFORM_NAV.filter(
  (item) => !MOBILE_PRIMARY_HREFS.includes(item.href as (typeof MOBILE_PRIMARY_HREFS)[number])
)

export function isNavItemActive(pathname: string | null, href: string) {
  if (!pathname) return false
  return pathname === href || pathname.startsWith(href + "/")
}

/**
 * Rutas inmersivas: ocupan toda la pantalla y traen su propia navegación
 * (el visor de lección ya tiene barra inferior propia con Contenido /
 * Comentarios / IA). Ahí se ocultan la cabecera y la barra global de móvil.
 */
export function isImmersiveRoute(pathname: string | null) {
  return Boolean(pathname?.startsWith("/learn/"))
}
