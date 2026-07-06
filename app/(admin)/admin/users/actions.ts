"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") throw new Error("Acceso denegado")
  return supabase
}

export async function updateUserAccessAction(
  userId: string,
  accessStatus: "pending" | "approved" | "suspended"
) {
  try {
    const supabase = await requireAdmin()

    const { error } = await supabase
      .from("profiles")
      .update({ access_status: accessStatus })
      .eq("id", userId)

    if (error) throw error

    revalidatePath("/admin/users")
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Error desconocido" }
  }
}

export async function adminSetUserPasswordAction(
  userId: string,
  newPassword: string
) {
  try {
    await requireAdmin()

    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: "La contraseña debe tener al menos 8 caracteres" }
    }
    if (newPassword.length > 72) {
      return { success: false, error: "La contraseña es demasiado larga (máx. 72)" }
    }

    const admin = supabaseAdmin()
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    if (error) throw error

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Error desconocido" }
  }
}

export async function updateUserRoleAction(
  userId: string,
  role: "student" | "mentor" | "admin"
) {
  try {
    const supabase = await requireAdmin()

    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId)

    if (error) throw error

    revalidatePath("/admin/users")
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Error desconocido" }
  }
}
