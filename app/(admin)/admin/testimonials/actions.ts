"use server"

import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { TESTIMONIAL_LEGAL_VERSION } from "@/lib/legal-versions"

const testimonialSchema = z.object({
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
  duration: z.number().nonnegative(),
}).superRefine((value, context) => {
  if (value.isThirdParty && !value.authorizationEvidence) {
    context.addIssue({
      code: "custom",
      path: ["authorizationEvidence"],
      message: "Debes identificar la evidencia escrita de autorización.",
    })
  }
  if (value.isThirdParty && !/^\d{4}-\d{2}-\d{2}$/.test(value.authorizationAcceptedAt)) {
    context.addIssue({
      code: "custom",
      path: ["authorizationAcceptedAt"],
      message: "Indica la fecha de la autorización de la tercera persona.",
    })
  }
})

export async function saveTestimonialAction(input: unknown) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "No autorizado" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (profile?.role !== "admin") return { error: "No autorizado" }

  const parsed = testimonialSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" }
  }

  const value = parsed.data
  const { error } = await supabaseAdmin().from("community_testimonials").insert({
    author_id: user.id,
    uploaded_by: user.id,
    subject_name: value.subjectName,
    testimonial_text: value.testimonialText || null,
    caption: value.testimonialText || value.subjectName,
    video_id: value.videoId,
    playback_url: value.videoUrl,
    thumbnail_url: value.thumbnail || null,
    duration_seconds: value.duration,
    audience: value.audience,
    consent_granted_at: value.isThirdParty
      ? new Date(`${value.authorizationAcceptedAt}T12:00:00.000Z`).toISOString()
      : new Date().toISOString(),
    consent_version: TESTIMONIAL_LEGAL_VERSION,
    consent_method: value.isThirdParty
      ? "written_third_party_authorization"
      : "uploader_checkbox",
    third_party_authorization_evidence: value.isThirdParty
      ? value.authorizationEvidence
      : null,
    status: "pending_review",
  })

  if (error) return { error: "No se pudo guardar el testimonio y su consentimiento." }
  return { success: true }
}
