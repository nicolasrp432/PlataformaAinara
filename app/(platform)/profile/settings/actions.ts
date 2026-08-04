"use server"

import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { createNotification } from "@/lib/services/notifications"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const passwordSchema = z
  .object({
    newPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
    confirmPassword: z.string().min(8),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  })

export async function changePasswordAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado." }

  const parsed = passwordSchema.safeParse({
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." }
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  })
  if (error) return { error: error.message }

  return { success: true }
}

const privacySchema = z.object({
  profile_visibility: z.enum(["private", "community", "public"]),
  allow_direct_messages: z.boolean(),
})

export async function updatePrivacySettings(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado." }

  const parsed = privacySchema.safeParse({
    profile_visibility: formData.get("profile_visibility"),
    allow_direct_messages: formData.get("allow_direct_messages") === "true",
  })
  if (!parsed.success) return { error: "Datos inválidos." }

  const { error } = await supabase
    .from("profiles")
    .update(parsed.data)
    .eq("id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/profile/settings")
  return { success: true }
}

/**
 * Solicitud de supresión de cuenta (art. 17 RGPD).
 *
 * Suspende el acceso de inmediato y deja constancia de la solicitud, para que
 * el borrado efectivo sea auditable y tenga plazo. Antes solo marcaba el perfil
 * como `suspended` sin registrar nada, así que no había forma de saber quién
 * había pedido la baja ni cuándo.
 */
export async function requestAccountDeactivation(reason?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado." }

  const { error } = await supabase
    .from("profiles")
    .update({ access_status: "suspended" })
    .eq("id", user.id)

  if (error) return { error: error.message }

  // Registro de la solicitud. Si la migración 0016 aún no se ha aplicado, esto
  // falla en silencio: la suspensión ya surtió efecto y no tiene sentido
  // bloquear al usuario por ello.
  const { error: requestError } = await supabase
    .from("deletion_requests")
    .insert({ user_id: user.id, reason: reason?.slice(0, 500) || null })

  if (requestError) {
    console.error("No se pudo registrar la solicitud de borrado:", requestError.message)
  }

  // Aviso a administración para ejecutar el borrado dentro de plazo.
  try {
    const admin = supabaseAdmin()
    const { data: admins } = await admin
      .from("profiles")
      .select("id")
      .eq("role", "admin")

    await Promise.all(
      (admins ?? []).map((a) =>
        createNotification(a.id as string, "system", {
          title: "Solicitud de eliminación de cuenta",
          body: `${user.email ?? "Un usuario"} ha solicitado la baja. Plazo máximo: 30 días.`,
          link: "/admin/users",
        })
      )
    )
  } catch (err) {
    console.error("No se pudo avisar a los administradores:", err)
  }

  revalidatePath("/profile")
  revalidatePath("/profile/settings")
  return { success: true }
}
