"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { deleteVideo } from "@/lib/cloudflare-stream"

async function adminClient() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") throw new Error("No autorizado")
  return { supabase, user }
}

export async function moderateTestimonial(formData: FormData) {
  const id = String(formData.get("id") || "")
  const action = String(formData.get("action") || "")
  const reason = String(formData.get("reason") || "").trim()
  const { supabase, user } = await adminClient()
  if (!id || !["approve", "reject", "archive", "delete"].includes(action)) throw new Error("Acción inválida")
  if (action === "reject" && reason.length < 3) throw new Error("Indica un motivo de rechazo")
  if (action === "delete") {
    const { data } = await supabase.from("community_testimonials").select("video_id").eq("id", id).single()
    if (data?.video_id) await deleteVideo(data.video_id)
    await supabase.from("community_testimonials").delete().eq("id", id)
  } else {
    const status = action === "approve" ? "published" : action === "reject" ? "rejected" : "archived"
    const { error } = await supabase.from("community_testimonials").update({ status, reviewed_by: user.id, reviewed_at: new Date().toISOString(), rejection_reason: action === "reject" ? reason : null }).eq("id", id)
    if (error) throw error
  }
  revalidatePath("/admin/testimonials")
  revalidatePath("/taberna")
}
