import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { createTusUploadUrl, getVideoDetails } from "@/lib/cloudflare-stream"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const { fileName, lessonId } = body

  if (!fileName) {
    return NextResponse.json({ error: "fileName is required" }, { status: 400 })
  }

  try {
    const upload = await createTusUploadUrl(fileName, {
      maxDurationSeconds: 7200,
      requireSignedURLs: false,
      meta: { lessonId: lessonId || "" },
    })
    return NextResponse.json({ uploadUrl: upload.uploadUrl, videoId: upload.uid })
  } catch (error) {
    console.error("Upload creation error:", error)
    return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get("videoId")

  if (!videoId) {
    return NextResponse.json({ error: "videoId is required" }, { status: 400 })
  }

  try {
    const video = await getVideoDetails(videoId)
    return NextResponse.json({
      videoId: video.uid,
      status: video.status.state,
      readyToStream: video.readyToStream,
      duration: video.duration,
      thumbnail: video.thumbnail,
      playback: video.playback,
      input: video.input,
    })
  } catch (error) {
    console.error("Get video status error:", error)
    return NextResponse.json({ error: "Failed to get video status" }, { status: 500 })
  }
}
