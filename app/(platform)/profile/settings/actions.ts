"use server"

import { createClient } from "@/lib/supabase/server"
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

export async function requestAccountDeactivation() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autenticado." }

  // Soft-delete: marca el perfil como suspendido. La eliminación dura
  // requiere intervención del equipo (RGPD) por compliance.
  const { error } = await supabase
    .from("profiles")
    .update({ access_status: "suspended" })
    .eq("id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/profile")
  return { success: true }
}
