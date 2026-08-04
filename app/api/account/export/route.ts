import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Portabilidad de datos (art. 20 RGPD).
 *
 * Devuelve un JSON descargable con todo lo que la plataforma guarda del usuario
 * autenticado. Usa el cliente sujeto a RLS a propósito: la propia base de datos
 * garantiza que nadie pueda exportar datos ajenos, aunque manipule la petición.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const [
    profile,
    reflectionsPrivate,
    reflectionsPublic,
    progress,
    enrollments,
    natalChart,
    messages,
    profileComments,
    notifications,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("daily_reflections").select("*").eq("user_id", user.id),
    supabase.from("reflections").select("*").eq("user_id", user.id),
    supabase.from("user_progress").select("*").eq("user_id", user.id),
    supabase.from("enrollments").select("*").eq("user_id", user.id),
    supabase.from("natal_charts").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("messages").select("*").eq("sender_id", user.id),
    supabase.from("profile_comments").select("*").eq("author_id", user.id),
    supabase.from("notifications").select("*").eq("user_id", user.id),
  ])

  const payload = {
    meta: {
      exportedAt: new Date().toISOString(),
      platform: "Mitra",
      note:
        "Copia de los datos personales asociados a tu cuenta, en cumplimiento del derecho de portabilidad (art. 20 RGPD).",
    },
    cuenta: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      metadata: user.user_metadata,
    },
    perfil: profile.data ?? null,
    diario_privado: reflectionsPrivate.data ?? [],
    reflexiones_publicas: reflectionsPublic.data ?? [],
    progreso: progress.data ?? [],
    inscripciones: enrollments.data ?? [],
    carta_natal: natalChart.data ?? null,
    mensajes_enviados: messages.data ?? [],
    comentarios_en_perfiles: profileComments.data ?? [],
    notificaciones: notifications.data ?? [],
  }

  const fecha = new Date().toISOString().slice(0, 10)

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="mitra-mis-datos-${fecha}.json"`,
      "Cache-Control": "no-store",
    },
  })
}
