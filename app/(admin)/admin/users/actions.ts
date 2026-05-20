"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

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
