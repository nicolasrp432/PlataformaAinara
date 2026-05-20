import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export type NotificationKind =
  | "admin_announcement"
  | "comment_reply"
  | "mention"
  | "new_message"
  | "mentorship_booked"
  | "system"

interface NotificationPayload {
  title: string
  body?: string
  link?: string
  metadata?: Record<string, unknown>
  createdBy?: string
}

export type NotificationAudience =
  | { type: "all" }
  | { type: "role"; value: "student" | "mentor" }
  | { type: "formation"; value: string }
  | { type: "user_ids"; value: string[] }

// ── Escritura (usa service role para bypassear RLS de INSERT) ────────────────

export async function createNotification(
  userId: string,
  kind: NotificationKind,
  payload: NotificationPayload
) {
  const admin = supabaseAdmin()
  const { error } = await admin.from("notifications").insert({
    user_id: userId,
    kind,
    title: payload.title,
    body: payload.body ?? null,
    link: payload.link ?? null,
    metadata: payload.metadata ?? {},
    created_by: payload.createdBy ?? null,
  })
  if (error) console.error("[notifications] createNotification:", error.message)
}

const CHUNK = 500

export async function createBulkNotifications(
  userIds: string[],
  kind: NotificationKind,
  payload: NotificationPayload
) {
  if (userIds.length === 0) return
  const admin = supabaseAdmin()
  for (let i = 0; i < userIds.length; i += CHUNK) {
    const chunk = userIds.slice(i, i + CHUNK)
    const rows = chunk.map((uid) => ({
      user_id: uid,
      kind,
      title: payload.title,
      body: payload.body ?? null,
      link: payload.link ?? null,
      metadata: payload.metadata ?? {},
      created_by: payload.createdBy ?? null,
    }))
    const { error } = await admin.from("notifications").insert(rows)
    if (error) console.error("[notifications] createBulkNotifications chunk:", error.message)
  }
}

// ── Lectura / actualización (usa server client — respeta RLS) ─────────────────

export async function markAsRead(notificationId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .is("read_at", null)
  if (error) console.error("[notifications] markAsRead:", error.message)
}

export async function markAllAsRead(userId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null)
  if (error) console.error("[notifications] markAllAsRead:", error.message)
}

export async function listForUser(
  userId: string,
  opts: { limit?: number; cursor?: string; onlyUnread?: boolean } = {}
) {
  const supabase = await createClient()
  const limit = opts.limit ?? 20
  let query = supabase
    .from("notifications")
    .select("id, kind, title, body, link, read_at, created_at, metadata")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (opts.onlyUnread) query = query.is("read_at", null)
  if (opts.cursor) query = query.lt("created_at", opts.cursor)

  const { data, error } = await query
  if (error) console.error("[notifications] listForUser:", error.message)
  return data ?? []
}

export async function countUnread(userId: string): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null)
  if (error) console.error("[notifications] countUnread:", error.message)
  return count ?? 0
}

// ── Resolución de audiencias ──────────────────────────────────────────────────

async function resolveAudience(audience: NotificationAudience): Promise<string[]> {
  const admin = supabaseAdmin()

  if (audience.type === "user_ids") return audience.value

  if (audience.type === "all") {
    const { data } = await admin.from("profiles").select("id")
    return (data ?? []).map((r) => r.id)
  }

  if (audience.type === "role") {
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("role", audience.value)
    return (data ?? []).map((r) => r.id)
  }

  if (audience.type === "formation") {
    const { data } = await admin
      .from("user_progress")
      .select("user_id")
      .eq("formation_id", audience.value)
    const ids = [...new Set((data ?? []).map((r) => r.user_id))]
    return ids
  }

  return []
}

// ── Campaña admin ─────────────────────────────────────────────────────────────

interface CampaignParams {
  audience: NotificationAudience
  title: string
  body: string
  link?: string
  adminId: string
}

export async function sendAdminCampaign(params: CampaignParams) {
  const { audience, title, body, link, adminId } = params
  const userIds = await resolveAudience(audience)
  const recipientCount = userIds.length

  await createBulkNotifications(userIds, "admin_announcement", {
    title,
    body,
    link,
    createdBy: adminId,
  })

  const admin = supabaseAdmin()
  await admin.from("notification_campaigns").insert({
    created_by: adminId,
    audience,
    channel: "in_app",
    title,
    body,
    link: link ?? null,
    recipient_count: recipientCount,
  })

  return { recipientCount }
}
