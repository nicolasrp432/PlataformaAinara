import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import {
  canEnterPlatform,
  getRouteAccess,
  hasFullAccess,
  isAuthEntryRoute,
  resolveAccessTier,
  safeRedirectTarget,
} from "@/lib/access"

/**
 * Cookie de caché del perfil. Guarda `<userId>|<role>|<accessStatus>` en vez
 * de solo el valor: si en el mismo navegador entra otra cuenta, el id no
 * coincide y la caché se descarta en lugar de heredar los permisos de la
 * sesión anterior.
 */
const PROFILE_CACHE_COOKIE = "x-user-access"
const PROFILE_CACHE_MAX_AGE = 60 // segundos

function parseProfileCache(raw: string | undefined, userId: string) {
  if (!raw) return null
  const [cachedId, role, accessStatus] = raw.split("|")
  if (cachedId !== userId || !role || !accessStatus) return null
  return { role, accessStatus }
}

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

  // ── Resolver rol + estado de acceso (cacheado 60s en cookie) ───────────
  const cached = parseProfileCache(
    request.cookies.get(PROFILE_CACHE_COOKIE)?.value,
    user.id
  )

  let role = cached?.role ?? ""
  let accessStatus = cached?.accessStatus ?? ""

  if (!cached) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, access_status")
      .eq("id", user.id)
      .single()

    role = profile?.role ?? "student"
    accessStatus = profile?.access_status ?? "pending"

    supabaseResponse.cookies.set(
      PROFILE_CACHE_COOKIE,
      `${user.id}|${role}|${accessStatus}`,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: PROFILE_CACHE_MAX_AGE,
      }
    )
  }

  const tier = resolveAccessTier(role, accessStatus)

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

  if (routeAccess === "member" && !hasFullAccess(tier)) {
    const url = request.nextUrl.clone()
    url.pathname = "/billing"
    url.search = ""
    url.searchParams.set("reason", "subscription")
    url.searchParams.set("from", pathname)
    return NextResponse.redirect(url)
  }

  // `authenticated`: el catálogo y las formaciones se abren para todos.
  // El candado por lección lo aplica la capa de datos, no el middleware.
  return supabaseResponse
}
