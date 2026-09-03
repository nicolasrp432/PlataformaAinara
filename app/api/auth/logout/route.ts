import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Cierre de sesión en el servidor.
 *
 * Se hace aquí y no en el cliente porque la cookie de caché de perfil
 * (`x-user-access`) es httpOnly: JavaScript no puede borrarla. Si se quedara
 * viva, la siguiente persona que inicie sesión en este mismo navegador dentro
 * de la ventana de caché heredaría el rol y el nivel de acceso de la sesión
 * anterior.
 */
async function signOut(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const response = NextResponse.redirect(new URL("/login", request.url), {
    status: 303,
  })

  // Borrado explícito sobre la respuesta. `signOut()` ya limpia las cookies a
  // través del almacén de `next/headers`, pero aquí se devuelve una respuesta
  // construida a mano: dejar el borrado escrito evita depender de cómo se
  // fusionen ambas cosas y hace que el resultado sea el mismo siempre.
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      response.cookies.delete(cookie.name)
    }
  }
  response.cookies.delete("x-user-access")
  // Cookie del modelo antiguo: se borra para no dejar rastro en navegadores
  // que ya la tuvieran guardada.
  response.cookies.delete("x-user-role")

  return response
}

export async function GET(request: NextRequest) {
  return signOut(request)
}

export async function POST(request: NextRequest) {
  return signOut(request)
}
