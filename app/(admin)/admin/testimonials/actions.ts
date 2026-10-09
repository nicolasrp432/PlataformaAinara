"use server";

import { requireAdmin as requireAdminGuard } from "@/lib/guards";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { TESTIMONIAL_LEGAL_VERSION } from "@/lib/legal-versions";

const testimonialSchema = z
  .object({
    subjectName: z.string().trim().min(1).max(160),
    testimonialText: z.string().trim().max(4000),
    audience: z.enum(["public_web", "registered_users", "private_review"]),
    consent: z.literal(true),
    isThirdParty: z.boolean(),
    authorizationAcceptedAt: z.string(),
    authorizationEvidence: z.string().trim().max(2000),
    videoId: z.string().min(1),
    videoUrl: z.string().url(),
    thumbnail: z.string().url().or(z.literal("")),
    duration: z.number().positive().max(90),
  })
  .superRefine((value, context) => {
    if (value.isThirdParty && !value.authorizationEvidence) {
      context.addIssue({
        code: "custom",
        path: ["authorizationEvidence"],
        message: "Debes identificar la evidencia escrita de autorización.",
      });
    }
    if (
      value.isThirdParty &&
      !/^\d{4}-\d{2}-\d{2}$/.test(value.authorizationAcceptedAt)
    ) {
      context.addIssue({
        code: "custom",
        path: ["authorizationAcceptedAt"],
        message: "Indica la fecha de la autorización de la tercera persona.",
      });
    }
  });

export async function saveTestimonialAction(input: unknown) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return { error: "No autorizado" };

  const parsed = testimonialSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const value = parsed.data;
  const { error } = await supabase
    .from("community_testimonials")
    .insert({
      author_id: user.id,
      uploaded_by: user.id,
      subject_name: value.subjectName,
      testimonial_text: value.testimonialText || null,
      caption: (value.testimonialText || value.subjectName).slice(0, 1000),
      video_id: value.videoId,
      playback_url: value.videoUrl,
      thumbnail_url: value.thumbnail || null,
      duration_seconds: value.duration,
      audience: value.audience,
      consent_granted_at: value.isThirdParty
        ? new Date(
            `${value.authorizationAcceptedAt}T12:00:00.000Z`,
          ).toISOString()
        : new Date().toISOString(),
      consent_version: TESTIMONIAL_LEGAL_VERSION,
      consent_method: value.isThirdParty
        ? "written_third_party_authorization"
        : "uploader_checkbox",
      third_party_authorization_evidence: value.isThirdParty
        ? value.authorizationEvidence
        : null,
      status: "pending_review",
    });

  if (error)
    return { error: "No se pudo guardar el testimonio y su consentimiento." };
  revalidatePath("/admin/testimonials");
  return { success: true };
}

export async function moderateTestimonial(input: unknown) {
  const user = await requireAdminGuard();
  const parsed = z
    .object({
      id: z.string().uuid(),
      status: z.enum(["published", "rejected", "archived"]),
      reason: z.string().trim().max(1000),
    })
    .safeParse(input);
  if (!parsed.success) return { error: "Datos de moderación inválidos" };
  const db = await createClient();
  const { data: current, error: readError } = await db
    .from("community_testimonials")
    .select(
      "id,status,consent_granted_at,consent_version,audience,playback_url,deleted_at",
    )
    .eq("id", parsed.data.id)
    .single();
  if (readError || !current || current.deleted_at)
    return { error: "Testimonio no disponible" };
  if (
    parsed.data.status === "published" &&
    (!current.consent_granted_at ||
      !current.consent_version ||
      !current.playback_url ||
      current.audience === "private_review")
  )
    return {
      error:
        "No se puede publicar sin vídeo y consentimiento para una audiencia visible",
    };
  if (parsed.data.status === "rejected" && !parsed.data.reason)
    return { error: "Indica el motivo del rechazo" };
  const { error } = await db
    .from("community_testimonials")
    .update({
      status: parsed.data.status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason:
        parsed.data.status === "rejected" ? parsed.data.reason : null,
    })
    .eq("id", current.id)
    .eq("status", current.status)
    .select("id")
    .single();
  if (error)
    return {
      error: "El testimonio ha cambiado. Recarga y vuelve a intentarlo",
    };
  revalidatePath("/admin/testimonials");
  revalidatePath("/taberna");
  revalidatePath("/");
  return { success: true };
}
