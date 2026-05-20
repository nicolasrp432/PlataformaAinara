"use server"

import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { sendAdminCampaign } from "@/lib/services/notifications"
import { z } from "zod"

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (profile?.role !== "admin") return null
  return user
}

const campaignSchema = z.object({
  title: z.string().min(1, "El título es obligatorio").max(200),
  body: z.string().min(1, "El mensaje es obligatorio").max(2000),
  link: z.string().url("URL inválida").optional().or(z.literal("")),
  audienceType: z.enum(["all", "role", "formation", "user_ids"]),
  audienceValue: z.string().optional(),
})

export async function sendCampaignAction(formData: FormData) {
  const user = await requireAdmin()
  if (!user) return { error: "No autorizado" }

  const raw = {
    title: formData.get("title") as string,
    body: formData.get("body") as string,
    link: (formData.get("link") as string) || "",
    audienceType: formData.get("audienceType") as string,
    audienceValue: (formData.get("audienceValue") as string) || "",
  }

  const parsed = campaignSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" }
  }

  const { title, body, link, audienceType, audienceValue } = parsed.data

  type AudienceType =
    | { type: "all" }
    | { type: "role"; value: "student" | "mentor" }
    | { type: "formation"; value: string }
    | { type: "user_ids"; value: string[] }

  let audience: AudienceType
  if (audienceType === "all") {
    audience = { type: "all" }
  } else if (audienceType === "role") {
    if (audienceValue !== "student" && audienceValue !== "mentor") {
      return { error: "Rol inválido" }
    }
    audience = { type: "role", value: audienceValue }
  } else if (audienceType === "formation") {
    if (!audienceValue) return { error: "Selecciona una formación" }
    audience = { type: "formation", value: audienceValue }
  } else {
    const ids = audienceValue?.split(",").map((s) => s.trim()).filter(Boolean) ?? []
    if (ids.length === 0) return { error: "Introduce al menos un ID de usuario" }
    audience = { type: "user_ids", value: ids }
  }

  const result = await sendAdminCampaign({
    audience,
    title,
    body,
    link: link || undefined,
    adminId: user.id,
  })

  return { success: true, recipientCount: result.recipientCount }
}

export async function getNotificationCampaigns() {
  const user = await requireAdmin()
  if (!user) return []

  const admin = supabaseAdmin()
  const { data } = await admin
    .from("notification_campaigns")
    .select("id, title, body, audience, recipient_count, sent_at, channel")
    .order("sent_at", { ascending: false })
    .limit(20)

  return data ?? []
}

export async function getFormationsForAudience() {
  const user = await requireAdmin()
  if (!user) return []

  const admin = supabaseAdmin()
  const { data } = await admin
    .from("formations")
    .select("id, title")
    .eq("is_published", true)
    .order("title")

  return data ?? []
}
