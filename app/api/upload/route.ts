import { NextRequest, NextResponse } from "next/server"
import { createTusUploadUrl, getVideoDetails } from "@/lib/cloudflare-stream"

/**
 * POST /api/upload
 * Creates a direct upload URL for Cloudflare Stream
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication (you should implement proper auth here)
    const authHeader = request.headers.get("Authorization")
    if (!authHeader) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { fileName, lessonId, meta } = body
    
    if (!fileName) {
      return NextResponse.json(
        { error: "fileName is required" },
        { status: 400 }
      )
    }
    
    // Create the TUS upload URL
    const upload = await createTusUploadUrl(fileName, {
      maxDurationSeconds: 7200, // 2 hours max
      requireSignedURLs: false, // Set to true if you want signed URLs
      meta: {
        lessonId: lessonId || "",
        ...meta,
      },
    })
    
    return NextResponse.json({
      uploadUrl: upload.uploadUrl,
      videoId: upload.uid,
    })
  } catch (error) {
    console.error("Upload creation error:", error)
    return NextResponse.json(
      { error: "Failed to create upload URL" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/upload?videoId=xxx
 * Gets the status of an uploaded video
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get("videoId")
    
    if (!videoId) {
      return NextResponse.json(
        { error: "videoId is required" },
        { status: 400 }
      )
    }
    
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
    return NextResponse.json(
      { error: "Failed to get video status" },
      { status: 500 }
    )
  }
}
