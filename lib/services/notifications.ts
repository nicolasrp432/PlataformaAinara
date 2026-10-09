import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type NotificationKind =
  | "admin_announcement"
  | "comment_reply"
  | "mention"
  | "new_message"
  | "mentorship_booked"
  | "system";

interface NotificationPayload {
  title: string;
  body?: string;
  link?: string;
  metadata?: Record<string, unknown>;
  createdBy?: string;
}

export type NotificationAudience =
  | { type: "all" }
  | { type: "role"; value: "student" | "mentor" }
  | { type: "formation"; value: string }
  | { type: "user_ids"; value: string[] };

// ── Escritura (usa service role para bypassear RLS de INSERT) ────────────────

export async function createNotification(
  userId: string,
  kind: NotificationKind,
  payload: NotificationPayload,
) {
  try {
    const admin = supabaseAdmin();
    const { error } = await admin.from("notifications").insert({
      user_id: userId,
      kind,
      title: payload.title,
      body: payload.body ?? null,
      link: payload.link ?? null,
      metadata: payload.metadata ?? {},
      created_by: payload.createdBy ?? null,
    });

    if (error) {
      console.error("[notifications] createNotification:", error.message);
      // Si falla por el tipo enum en Postgres, reintentar con 'system' como fallback seguro
      if (
        error.message.includes("notification_kind") ||
        kind === "new_message"
      ) {
        const { error: fallbackError } = await admin
          .from("notifications")
          .insert({
            user_id: userId,
            kind: "system",
            title: payload.title,
            body: payload.body ?? null,
            link: payload.link ?? null,
            metadata: { ...(payload.metadata ?? {}), originalKind: kind },
            created_by: payload.createdBy ?? null,
          });
        if (fallbackError) {
          console.error(
            "[notifications] createNotification fallback failed:",
            fallbackError.message,
          );
        }
      }
    }
  } catch (err) {
    console.error("[notifications] createNotification exception:", err);
  }
}

const CHUNK = 500;

export async function createBulkNotifications(
  userIds: string[],
  kind: NotificationKind,
  payload: NotificationPayload,
) {
  if (userIds.length === 0) return;
  const admin = supabaseAdmin();
  for (let i = 0; i < userIds.length; i += CHUNK) {
    const chunk = userIds.slice(i, i + CHUNK);
    const rows = chunk.map((uid) => ({
      user_id: uid,
      kind,
      title: payload.title,
      body: payload.body ?? null,
      link: payload.link ?? null,
      metadata: payload.metadata ?? {},
      created_by: payload.createdBy ?? null,
    }));
    const { error } = await admin.from("notifications").insert(rows);
    if (error) {
      console.error(
        "[notifications] createBulkNotifications chunk:",
        error.message,
      );
      if (error.message.includes("notification_kind")) {
        const fallbackRows = rows.map((r) => ({
          ...r,
          kind: "system" as const,
          metadata: { ...r.metadata, originalKind: kind },
        }));
        await admin.from("notifications").insert(fallbackRows);
      }
    }
  }
}

// ── Lectura / actualización (usa server client — respeta RLS) ─────────────────

export async function markAsRead(notificationId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .is("read_at", null);
  if (error) console.error("[notifications] markAsRead:", error.message);
}

export async function markAllAsRead(userId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
  if (error) console.error("[notifications] markAllAsRead:", error.message);
}

export async function listForUser(
  userId: string,
  opts: { limit?: number; cursor?: string; onlyUnread?: boolean } = {},
) {
  const supabase = await createClient();
  const limit = opts.limit ?? 20;
  let query = supabase
    .from("notifications")
    .select("id, kind, title, body, link, read_at, created_at, metadata")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (opts.onlyUnread) query = query.is("read_at", null);
  if (opts.cursor) query = query.lt("created_at", opts.cursor);

  const { data, error } = await query;
  if (error) console.error("[notifications] listForUser:", error.message);
  return data ?? [];
}

export async function countUnread(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  if (error) console.error("[notifications] countUnread:", error.message);
  return count ?? 0;
}

// ── Resolución de audiencias ──────────────────────────────────────────────────

export async function resolveAudience(
  audience: NotificationAudience,
): Promise<string[]> {
  const admin = supabaseAdmin();

  if (audience.type === "user_ids") return audience.value;

  if (audience.type === "all") {
    const { data } = await admin.from("profiles").select("id");
    return (data ?? []).map((r) => r.id);
  }

  if (audience.type === "role") {
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("role", audience.value);
    return (data ?? []).map((r) => r.id);
  }

  if (audience.type === "formation") {
    const { data } = await admin
      .from("enrollments")
      .select("user_id")
      .eq("formation_id", audience.value);
    const ids = [...new Set((data ?? []).map((r) => r.user_id))];
    return ids;
  }

  return [];
}

// ── Campaña admin ─────────────────────────────────────────────────────────────

interface CampaignParams {
  audience: NotificationAudience;
  title: string;
  body: string;
  link?: string;
  adminId: string;
  requestId: string;
}

export async function sendAdminCampaign(params: CampaignParams) {
  const db = await createClient();
  const { data, error } = await db.rpc("admin_send_campaign", {
    p_title: params.title,
    p_body: params.body,
    p_link: params.link ?? "",
    p_audience: params.audience,
    p_request_id: params.requestId,
  });
  if (error) throw new Error(error.message);
  return { recipientCount: Number(data) };
}
