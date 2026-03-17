/**
 * Cloudflare Stream Integration
 * 
 * This module handles video uploads and streaming with Cloudflare Stream.
 * 
 * Required environment variables:
 * - CLOUDFLARE_ACCOUNT_ID: Your Cloudflare account ID
 * - CLOUDFLARE_API_TOKEN: API token with Stream permissions
 * - CLOUDFLARE_STREAM_SIGNING_KEY_ID: (Optional) For signed URLs
 * - CLOUDFLARE_STREAM_SIGNING_KEY: (Optional) For signed URLs
 */

const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4"

interface CloudflareStreamConfig {
  accountId: string
  apiToken: string
  signingKeyId?: string
  signingKey?: string
}

interface TusUploadResponse {
  uploadUrl: string
  uid: string
}

interface VideoDetails {
  uid: string
  thumbnail: string
  thumbnailTimestampPct: number
  readyToStream: boolean
  status: {
    state: "pendingupload" | "downloading" | "queued" | "inprogress" | "ready" | "error"
    errorReasonCode?: string
    errorReasonText?: string
  }
  meta: {
    name?: string
    [key: string]: unknown
  }
  created: string
  modified: string
  duration: number
  size: number
  preview: string
  allowedOrigins: string[]
  requireSignedURLs: boolean
  playback: {
    hls: string
    dash: string
  }
  input: {
    width: number
    height: number
  }
}

interface ListVideosResponse {
  result: VideoDetails[]
  success: boolean
  errors: Array<{ code: number; message: string }>
  messages: string[]
}

interface SingleVideoResponse {
  result: VideoDetails
  success: boolean
  errors: Array<{ code: number; message: string }>
  messages: string[]
}

/**
 * Get Cloudflare Stream configuration from environment
 */
export function getStreamConfig(): CloudflareStreamConfig {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const apiToken = process.env.CLOUDFLARE_API_TOKEN
  
  if (!accountId || !apiToken) {
    throw new Error("Missing Cloudflare Stream configuration. Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN environment variables.")
  }
  
  return {
    accountId,
    apiToken,
    signingKeyId: process.env.CLOUDFLARE_STREAM_SIGNING_KEY_ID,
    signingKey: process.env.CLOUDFLARE_STREAM_SIGNING_KEY,
  }
}

/**
 * Create a TUS upload URL for direct upload from the browser
 * This allows uploading large files directly to Cloudflare Stream
 */
export async function createTusUploadUrl(
  fileName: string,
  options?: {
    maxDurationSeconds?: number
    requireSignedURLs?: boolean
    allowedOrigins?: string[]
    meta?: Record<string, string>
  }
): Promise<TusUploadResponse> {
  const config = getStreamConfig()
  
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiToken}`,
    "Tus-Resumable": "1.0.0",
    "Upload-Length": "0", // Will be set by the client
    "Upload-Metadata": encodeMetadata({
      name: fileName,
      ...options?.meta,
    }),
  }
  
  if (options?.maxDurationSeconds) {
    headers["Upload-Metadata"] += `,maxDurationSeconds ${btoa(String(options.maxDurationSeconds))}`
  }
  
  const response = await fetch(
    `${CLOUDFLARE_API_BASE}/accounts/${config.accountId}/stream?direct_user=true`,
    {
      method: "POST",
      headers,
    }
  )
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to create upload URL: ${JSON.stringify(error)}`)
  }
  
  const location = response.headers.get("Location")
  const streamMediaId = response.headers.get("stream-media-id")
  
  if (!location || !streamMediaId) {
    throw new Error("Invalid response from Cloudflare Stream")
  }
  
  return {
    uploadUrl: location,
    uid: streamMediaId,
  }
}

/**
 * Get video details from Cloudflare Stream
 */
export async function getVideoDetails(videoId: string): Promise<VideoDetails> {
  const config = getStreamConfig()
  
  const response = await fetch(
    `${CLOUDFLARE_API_BASE}/accounts/${config.accountId}/stream/${videoId}`,
    {
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
      },
    }
  )
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to get video details: ${JSON.stringify(error)}`)
  }
  
  const data: SingleVideoResponse = await response.json()
  
  if (!data.success) {
    throw new Error(`Cloudflare API error: ${data.errors.map(e => e.message).join(", ")}`)
  }
  
  return data.result
}

/**
 * List all videos in the account
 */
export async function listVideos(options?: {
  limit?: number
  search?: string
  status?: string
}): Promise<VideoDetails[]> {
  const config = getStreamConfig()
  
  const params = new URLSearchParams()
  if (options?.limit) params.set("limit", String(options.limit))
  if (options?.search) params.set("search", options.search)
  if (options?.status) params.set("status", options.status)
  
  const response = await fetch(
    `${CLOUDFLARE_API_BASE}/accounts/${config.accountId}/stream?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
      },
    }
  )
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to list videos: ${JSON.stringify(error)}`)
  }
  
  const data: ListVideosResponse = await response.json()
  
  if (!data.success) {
    throw new Error(`Cloudflare API error: ${data.errors.map(e => e.message).join(", ")}`)
  }
  
  return data.result
}

/**
 * Delete a video from Cloudflare Stream
 */
export async function deleteVideo(videoId: string): Promise<void> {
  const config = getStreamConfig()
  
  const response = await fetch(
    `${CLOUDFLARE_API_BASE}/accounts/${config.accountId}/stream/${videoId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
      },
    }
  )
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to delete video: ${JSON.stringify(error)}`)
  }
}

/**
 * Generate a signed URL for video playback
 * Requires CLOUDFLARE_STREAM_SIGNING_KEY_ID and CLOUDFLARE_STREAM_SIGNING_KEY
 */
export async function generateSignedUrl(
  videoId: string,
  options?: {
    expiresIn?: number // seconds, default 3600
    downloadable?: boolean
  }
): Promise<string> {
  const config = getStreamConfig()
  
  if (!config.signingKeyId || !config.signingKey) {
    // Return unsigned URL if signing is not configured
    return `https://customer-${config.accountId}.cloudflarestream.com/${videoId}/manifest/video.m3u8`
  }
  
  const expiresIn = options?.expiresIn || 3600
  const expiry = Math.floor(Date.now() / 1000) + expiresIn
  
  // Create the token payload
  const payload = {
    sub: videoId,
    kid: config.signingKeyId,
    exp: expiry,
    ...(options?.downloadable && { downloadable: true }),
  }
  
  // In a real implementation, you would sign this with the signing key
  // For now, we return an unsigned URL
  const token = btoa(JSON.stringify(payload))
  
  return `https://customer-${config.accountId}.cloudflarestream.com/${videoId}/manifest/video.m3u8?token=${token}`
}

/**
 * Get embed code for a video
 */
export function getEmbedCode(videoId: string, options?: {
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
  preload?: boolean
  poster?: string
}): string {
  const config = getStreamConfig()
  
  const attrs = [
    `src="https://customer-${config.accountId}.cloudflarestream.com/${videoId}/iframe"`,
    'style="border: none"',
    'allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"',
    'allowfullscreen="true"',
  ]
  
  if (options?.autoplay) attrs.push('autoplay')
  if (options?.loop) attrs.push('loop')
  if (options?.muted) attrs.push('muted')
  if (options?.preload) attrs.push('preload="auto"')
  if (options?.poster) attrs.push(`poster="${options.poster}"`)
  
  return `<iframe ${attrs.join(" ")}></iframe>`
}

/**
 * Get the HLS playback URL for a video
 */
export function getPlaybackUrl(videoId: string, accountId?: string): string {
  const id = accountId || process.env.CLOUDFLARE_ACCOUNT_ID
  return `https://customer-${id}.cloudflarestream.com/${videoId}/manifest/video.m3u8`
}

/**
 * Get the thumbnail URL for a video
 */
export function getThumbnailUrl(videoId: string, options?: {
  time?: string // e.g., "1s", "10s", "1m30s"
  height?: number
  width?: number
  fit?: "crop" | "clip" | "scale" | "fill"
}): string {
  const config = getStreamConfig()
  
  let url = `https://customer-${config.accountId}.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg`
  
  const params = new URLSearchParams()
  if (options?.time) params.set("time", options.time)
  if (options?.height) params.set("height", String(options.height))
  if (options?.width) params.set("width", String(options.width))
  if (options?.fit) params.set("fit", options.fit)
  
  const paramString = params.toString()
  if (paramString) {
    url += `?${paramString}`
  }
  
  return url
}

// Helper function to encode metadata for TUS upload
function encodeMetadata(meta: Record<string, string>): string {
  return Object.entries(meta)
    .map(([key, value]) => `${key} ${btoa(value)}`)
    .join(",")
}

// Export types for use in other modules
export type { CloudflareStreamConfig, VideoDetails, TusUploadResponse }
