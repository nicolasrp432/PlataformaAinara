import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getStripe } from "@/lib/stripe"
import { grantLifetimeAccess, syncSubscription } from "@/lib/services/subscription"

/**
 * Retorno del checkout de Stripe.
 *
 * Antes el `success_url` apuntaba a `/auth/callback`, que espera un `?code=`
 * de Supabase. Al volver del pago no hay tal código, así que el usuario
 * aterrizaba en la página de error justo después de pagar.
 *
 * Ahora se verifica la sesión contra Stripe aquí mismo y se concede el acceso
 * en el acto, sin esperar al webhook. El webhook sigue siendo la fuente
 * duradera (renovaciones, impagos, cancelaciones); esto solo elimina la
 * ventana en la que el usuario ha pagado y todavía ve candados.
 *
 * Atiende los dos modos: en `mode: "payment"` NO hay objeto `subscription`,
 * así que el código no puede darlo por hecho.
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id")
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/login?redirect=/billing", request.url))
  }

  const failure = new URL("/billing", request.url)
  failure.searchParams.set("checkout", "pending")

  if (!sessionId) return NextResponse.redirect(failure)

  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "line_items"],
    })

    // La sesión debe pertenecer a quien está navegando: sin esta comprobación
    // un `session_id` ajeno bastaría para concederse acceso.
    if (session.metadata?.supabase_user_id !== user.id) {
      return NextResponse.redirect(failure)
    }

    if (session.payment_status !== "paid" && session.status !== "complete") {
      return NextResponse.redirect(failure)
    }

    if (session.mode === "subscription") {
      const subscription = session.subscription
      if (subscription && typeof subscription !== "string") {
        await syncSubscription({ userId: user.id, subscription })
      }
    } else if (session.mode === "payment") {
      await grantLifetimeAccess({ userId: user.id, session })
    }
  } catch (error) {
    console.error("[billing/success] no se pudo verificar la sesión:", error)
    return NextResponse.redirect(failure)
  }

  const success = new URL("/dashboard", request.url)
  success.searchParams.set("checkout", "success")
  const response = NextResponse.redirect(success)

  // La caché de perfil del middleware vive 60s en cookie. Sin borrarla, el
  // usuario que acaba de pagar seguiría viendo candados durante ese minuto.
  response.cookies.delete("x-user-access")

  return response
}
