import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/dashboard'
  // Solo rutas internas, nunca URLs absolutas externas
  const next = rawNext.startsWith('/') ? rawNext : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Recuperación de contraseña: ir siempre al formulario de reset,
      // aunque la cuenta esté pendiente de aprobación.
      if (next.startsWith('/reset-password')) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      // Check profile access status before deciding where to redirect
      const { data: profile } = await supabase
        .from("profiles")
        .select("access_status, role")
        .eq("id", data.user.id)
        .single()

      const accessStatus = profile?.access_status ?? "pending"
      const role = profile?.role ?? "student"
      const hasAccess =
        accessStatus === "approved" || role === "admin" || role === "mentor"

      const destination = hasAccess ? next : "/pending"
      return NextResponse.redirect(`${origin}${destination}`)
    }
  }

  // Propagar el error real de Supabase (p.ej. otp_expired) si viene en la URL
  const supabaseError =
    searchParams.get('error_description') ?? searchParams.get('error')
  const message =
    supabaseError ?? 'No se pudo verificar el enlace. Solicita uno nuevo.'
  return NextResponse.redirect(
    `${origin}/auth/error?error=${encodeURIComponent(message)}`
  )
}
