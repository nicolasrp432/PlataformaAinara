"use server";

import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendAdminCampaign } from "@/lib/services/notifications";
import { revalidatePath } from "next/cache";
import { validNotificationLink } from "@/lib/notification-link";
import { z } from "zod";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return null;
  return user;
}

const campaignSchema = z.object({
  requestId: z.string().uuid(),
  title: z.string().trim().min(1, "El título es obligatorio").max(200),
  body: z.string().trim().min(1, "El mensaje es obligatorio").max(2000),
  link: z
    .string()
    .max(2048)
    .refine(validNotificationLink, "Usa una ruta interna o una URL HTTPS"),
  audienceType: z.enum(["all", "role", "formation", "user_ids"]),
  audienceValue: z.string().optional(),
});

export async function sendCampaignAction(formData: FormData) {
  const user = await requireAdmin();
  if (!user) return { error: "No autorizado" };

  const raw = {
    requestId: formData.get("requestId"),
    title: formData.get("title") as string,
    body: formData.get("body") as string,
    link: (formData.get("link") as string) || "",
    audienceType: formData.get("audienceType") as string,
    audienceValue: (formData.get("audienceValue") as string) || "",
  };

  const parsed = campaignSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { requestId, title, body, link, audienceType, audienceValue } =
    parsed.data;

  type AudienceType =
    | { type: "all" }
    | { type: "role"; value: "student" | "mentor" }
    | { type: "formation"; value: string }
    | { type: "user_ids"; value: string[] };

  let audience: AudienceType;
  if (audienceType === "all") {
    audience = { type: "all" };
  } else if (audienceType === "role") {
    if (audienceValue !== "student" && audienceValue !== "mentor") {
      return { error: "Rol inválido" };
    }
    audience = { type: "role", value: audienceValue };
  } else if (audienceType === "formation") {
    if (!z.string().uuid().safeParse(audienceValue).success)
      return { error: "Selecciona una formación" };
    audience = { type: "formation", value: audienceValue! };
  } else {
    const ids =
      audienceValue
        ?.split(",")
        .map((s) => s.trim())
        .filter(Boolean) ?? [];
    if (ids.length === 0)
      return { error: "Introduce al menos un ID de usuario" };
    if (!z.array(z.string().uuid()).max(500).safeParse(ids).success)
      return { error: "Introduce IDs de usuario válidos" };
    audience = { type: "user_ids", value: [...new Set(ids)] };
  }

  try {
    const result = await sendAdminCampaign({
      audience,
      title,
      body,
      link: link || undefined,
      adminId: user.id,
      requestId,
    });
    revalidatePath("/admin/notifications");
    return { success: true, recipientCount: result.recipientCount };
  } catch {
    return {
      error:
        "No se pudo enviar la campaña. Comprueba los destinatarios y vuelve a intentarlo; no se duplicará el envío.",
    };
  }
}

export async function getNotificationCampaigns() {
  const user = await requireAdmin();
  if (!user) return [];

  const admin = supabaseAdmin();
  const { data } = await admin
    .from("notification_campaigns")
    .select("id, title, body, audience, recipient_count, sent_at, channel")
    .order("sent_at", { ascending: false })
    .limit(20);

  return data ?? [];
}

export async function getFormationsForAudience() {
  const user = await requireAdmin();
  if (!user) return [];

  const admin = supabaseAdmin();
  const { data } = await admin
    .from("formations")
    .select("id, title")
    .eq("is_published", true)
    .order("title");

  return data ?? [];
}
