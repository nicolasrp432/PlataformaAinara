import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// ── Routes that NEVER need auth ──────────────────────────────────────
const PUBLIC_ROUTES = ["/", "/re-conectate", "/evaluacion", "/herramientas"]

// ── Routes that need auth but NO subscription ─────────────────────────
// Usuarios registrados (sin suscripción) pueden acceder aquí
const FREE_PROTECTED_ROUTES = ["/dashboard", "/profile", "/pending", "/billing", "/logout", "/reflexion"]

// ── Routes that need auth + approved subscription ─────────────────────
const PREMIUM_ROUTES = [
  "/library",
  "/formations",
  "/learn",
  "/quest",
  "/taberna",
  "/mentorship",
  "/u",
  "/messages",
  "/assistant",
]

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Fast-path: skip auth entirely for known public routes (~100ms saved)
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const adminRoutes = ["/admin"]
  const authRoutes = ["/login", "/register"]

  const isFreeRoute = FREE_PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
  const isPremiumRoute = PREMIUM_ROUTES.some((route) => pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))
  const isProtectedRoute = isFreeRoute || isPremiumRoute || isAdminRoute

  // Redirect unauthenticated users to login
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  // Rutas que no requieren ningún chequeo adicional
  if (!isPremiumRoute && !isAdminRoute) {
    return supabaseResponse
  }

  // ── Check role + access_status via cookie cache (TTL 5 min) ──────────
  if (user && (isPremiumRoute || isAdminRoute)) {
    const cachedRole = request.cookies.get("x-user-role")?.value
    const cachedAccess = request.cookies.get("x-user-access")?.value

    let role: string = cachedRole ?? ""
    let accessStatus: string = cachedAccess ?? ""

    if (!role || !accessStatus) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, access_status")
        .eq("id", user.id)
        .single()

      role = profile?.role ?? "student"
      accessStatus = profile?.access_status ?? "pending"

      const baseCookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
      }
      // Rol: cache 5 min (cambios de rol son muy infrecuentes, solo via SQL)
      supabaseResponse.cookies.set("x-user-role", role, { ...baseCookieOptions, maxAge: 60 * 5 })
      // Access status: cache 60 seg para que aprobaciones del admin sean efectivas rápido
      supabaseResponse.cookies.set("x-user-access", accessStatus, { ...baseCookieOptions, maxAge: 60 })
    }

    const hasFullAccess =
      accessStatus === "approved" || role === "admin" || role === "mentor"

    // Verificar acceso a rutas de admin
    if (isAdminRoute) {
      if (role !== "admin" && role !== "mentor") {
        const url = request.nextUrl.clone()
        url.pathname = "/dashboard"
        return NextResponse.redirect(url)
      }
      return supabaseResponse
    }

    // Verificar acceso a rutas premium
    if (isPremiumRoute && !hasFullAccess) {
      const url = request.nextUrl.clone()
      url.pathname = "/billing"
      url.searchParams.set("reason", "subscription")
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
