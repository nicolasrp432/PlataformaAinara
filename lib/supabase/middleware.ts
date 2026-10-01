import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import {
  canEnterPlatform,
  getRouteAccess,
  tierMeetsRoute,
  isAuthEntryRoute,
  resolveAccessTier,
  safeRedirectTarget,
} from "@/lib/access"

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl
  const routeAccess = getRouteAccess(pathname)

  // Atajo: en rutas públicas no hace falta resolver la sesión, salvo en
  // /login y /register, donde sí queremos expulsar a quien ya ha entrado.
  if (routeAccess === "public" && !isAuthEntryRoute(pathname)) {
    return NextResponse.next({ request })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // No introducir código entre createServerClient y supabase.auth.getUser():
  // un fallo aquí provoca cierres de sesión aleatorios muy difíciles de depurar.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Ya autenticado en /login o /register → a la plataforma.
  if (user && isAuthEntryRoute(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = safeRedirectTarget(request.nextUrl.searchParams.get("redirect"))
    url.search = ""
    return NextResponse.redirect(url)
  }

  if (routeAccess === "public") {
    return supabaseResponse
  }

  // Sin sesión en zona privada → login, recordando a dónde iba.
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.search = ""
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  // Authorization must come from the database, never an unsigned browser cookie.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, access_status, has_lifetime_access")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return new NextResponse("No se pudo verificar tu acceso. Inténtalo de nuevo.", { status: 503 })
  }
  const role = profile.role
  const accessStatus = profile.access_status
  const hasLifetimeAccess = profile.has_lifetime_access === true

  const tier = resolveAccessTier({ role, accessStatus, hasLifetimeAccess })

  // Cuenta suspendida: solo puede ver el aviso, facturación y salir.
  if (!canEnterPlatform(tier)) {
    const allowedWhileSuspended = ["/pending", "/billing", "/logout", "/profile"]
    const isAllowed = allowedWhileSuspended.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    )
    if (!isAllowed) {
      const url = request.nextUrl.clone()
      url.pathname = "/pending"
      url.search = ""
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  if (routeAccess === "staff" && tier !== "staff") {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    url.search = ""
    return NextResponse.redirect(url)
  }

  // `content` exige haber comprado; `member`, suscripción activa. La regla
  // vive en `tierMeetsRoute` para que middleware y páginas no discrepen.
  if (!tierMeetsRoute(tier, routeAccess)) {
    const url = request.nextUrl.clone()
    url.pathname = "/billing"
    url.search = ""
    url.searchParams.set("reason", routeAccess === "member" ? "membership" : "access")
    url.searchParams.set("from", pathname)
    return NextResponse.redirect(url)
  }

  // `authenticated`: el catálogo y las formaciones se abren para todos.
  // El candado por lección lo aplica la capa de datos, no el middleware.
  return supabaseResponse
}
