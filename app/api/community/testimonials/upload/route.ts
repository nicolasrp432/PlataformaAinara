import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createTusUploadUrl, getVideoDetails } from "@/lib/cloudflare-stream"
import { TESTIMONIAL_CONSENT_VERSION, TESTIMONIAL_MAX_DURATION_SECONDS, validateTestimonialUpload } from "@/lib/community-testimonials"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const body = await request.json().catch(() => null)
  const errors = body ? validateTestimonialUpload(body) : ["Solicitud inválida"]
  if (errors.length) return NextResponse.json({ error: errors[0], errors }, { status: 400 })

  try {
    const upload = await createTusUploadUrl(body.fileName, {
      maxDurationSeconds: TESTIMONIAL_MAX_DURATION_SECONDS,
      requireSignedURLs: false,
      meta: { kind: "community-testimonial", authorId: user.id },
    })
    const { data, error } = await supabase.from("community_testimonials").insert({
      author_id: user.id, video_id: upload.uid, caption: body.caption.trim(),
      duration_seconds: Number(body.duration), status: "draft",
      consent_version: TESTIMONIAL_CONSENT_VERSION, consent_granted_at: new Date().toISOString(),
    }).select("id").single()
    if (error) throw error
    return NextResponse.json({ testimonialId: data.id, uploadUrl: upload.uploadUrl, videoId: upload.uid })
  } catch (error) {
    console.error("Testimonial upload creation failed", error)
    return NextResponse.json({ error: "No se pudo iniciar la subida" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  const testimonialId = request.nextUrl.searchParams.get("testimonialId")
  if (!testimonialId) return NextResponse.json({ error: "Falta testimonialId" }, { status: 400 })
  const { data: testimonial } = await supabase.from("community_testimonials").select("id, video_id, status").eq("id", testimonialId).single()
  if (!testimonial) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  const video = await getVideoDetails(testimonial.video_id)
  if (video.readyToStream) {
    const vertical = video.input.height > video.input.width
    const validDuration = video.duration <= TESTIMONIAL_MAX_DURATION_SECONDS
    await supabase.from("community_testimonials").update(vertical && validDuration ? {
      status: "pending_review", playback_url: video.playback.hls, thumbnail_url: video.thumbnail, duration_seconds: video.duration,
    } : { status: "draft", rejection_reason: "El vídeo procesado no cumple formato vertical o duración" }).eq("id", testimonial.id)
  } else if (testimonial.status === "draft") {
    await supabase.from("community_testimonials").update({ status: "processing" }).eq("id", testimonial.id)
  }
  const accepted = video.readyToStream && video.input.height > video.input.width && video.duration <= TESTIMONIAL_MAX_DURATION_SECONDS
  return NextResponse.json({ status: accepted ? "pending_review" : video.readyToStream ? "draft" : "processing", ready: accepted })
}
