import { NextResponse } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

/**
 * Verificación de enlaces de email vía token_hash (flujo recomendado por
 * Supabase para SSR). A diferencia del flujo PKCE con `?code=`, funciona
 * aunque el usuario abra el enlace en otro navegador o dispositivo.
 *
 * Requiere que las plantillas de email del dashboard de Supabase apunten a:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const rawNext = searchParams.get("next") ?? "/dashboard"
  // Solo rutas internas, nunca URLs absolutas externas
  const next = rawNext.startsWith("/") ? rawNext : "/dashboard"

  if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }

    const message =
      error.code === "otp_expired"
        ? "El enlace ha caducado. Solicita uno nuevo."
        : "El enlace no es válido o ya fue utilizado. Solicita uno nuevo."
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent(message)}`
    )
  }

  return NextResponse.redirect(
    `${origin}/auth/error?error=${encodeURIComponent("Enlace incompleto. Solicita uno nuevo.")}`
  )
}
