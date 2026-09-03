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
  /**
   * Requiere suscripción activa. Debe coincidir con `MEMBER_PREFIXES` de
   * `lib/access.ts`, que es quien lo hace cumplir en el middleware. Se marca
   * aquí para poder pintar el candado: un usuario gratuito que pulsa y acaba
   * en facturación sin aviso vive el redirect como un fallo, no como un
   * límite del plan.
   */
  requiresMembership?: boolean
}

/**
 * Navegación principal de la plataforma. Fuente única para el sidebar de
 * escritorio y para la barra inferior + hoja "Más" de móvil.
 */
export const PLATFORM_NAV: NavItem[] = [
  { name: "Dashboard",  href: "/dashboard",   icon: LayoutDashboard, shortName: "Inicio" },
  { name: "Biblioteca", href: "/library",     icon: BookOpen, shortName: "Cursos" },
  { name: "Reflexión",  href: "/reflexion",   icon: NotebookPen, shortName: "Reflexión" },
  { name: "Logros",     href: "/quest",       icon: Trophy, shortName: "Logros", requiresMembership: true },
  { name: "Comunidad",  href: "/taberna",     icon: MessageSquare, shortName: "Comunidad", requiresMembership: true },
  { name: "Mensajes",   href: "/messages",    icon: Mail, requiresMembership: true },
  { name: "Mentoría",   href: "/mentorship",  icon: Users, requiresMembership: true },
  { name: "Asistente",  href: "/assistant",   icon: Bot, requiresMembership: true },
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
