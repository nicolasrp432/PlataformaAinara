import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// ── Routes that NEVER need auth ──────────────────────────────────────
const PUBLIC_ROUTES = ["/", "/re-conectate", "/evaluacion", "/herramientas"]

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

  // Define protected routes
  const protectedRoutes = ["/dashboard", "/library", "/formations", "/learn", "/profile", "/quest", "/taberna", "/mentorship"]
  const adminRoutes = ["/admin"]
  const authRoutes = ["/login", "/register"]

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )
  const isAdminRoute = adminRoutes.some((route) =>
    pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // Redirect unauthenticated users to login
  if (!user && (isProtectedRoute || isAdminRoute)) {
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

  // Check admin access with cached role cookie
  if (user && isAdminRoute) {
    const cachedRole = request.cookies.get("x-user-role")?.value

    let role = cachedRole
    if (!role) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
      role = profile?.role || "student"

      // Cache the role for 5 minutes to avoid repeated DB queries
      supabaseResponse.cookies.set("x-user-role", role ?? "student", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 5, // 5 minutes
        path: "/",
      })
    }

    if (role !== "admin" && role !== "mentor") {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
