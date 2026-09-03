import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveAccessTier, canEnterPlatform, safeRedirectTarget } from '@/lib/access'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeRedirectTarget(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Recuperación de contraseña: ir siempre al formulario de reset.
      if (next.startsWith('/reset-password')) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('access_status, role')
        .eq('id', data.user.id)
        .single()

      const tier = resolveAccessTier(profile?.role, profile?.access_status)

      // Confirmar el email da acceso inmediato al nivel gratuito: el usuario
      // entra a la plataforma y ve la primera clase de cada formación. Solo
      // una cuenta suspendida se desvía al aviso correspondiente.
      const destination = canEnterPlatform(tier) ? next : '/pending'
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
