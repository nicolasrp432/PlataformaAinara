import { NextRequest, NextResponse } from "next/server"

/**
 * In-memory token bucket. Suficiente para single-instance dev/staging.
 * Para producción multi-instancia, migrar a Upstash Redis o similar.
 *
 * TODO(scale): replace with @upstash/ratelimit when traffic warrants.
 */
type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

interface RateLimitConfig {
  /** Window in milliseconds. */
  windowMs: number
  /** Max requests per window. */
  max: number
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  resetAt: number
}

function getClientKey(req: NextRequest, scope: string, userId?: string): string {
  if (userId) return `${scope}:u:${userId}`
  const fwd = req.headers.get("x-forwarded-for") ?? ""
  const ip = fwd.split(",")[0]?.trim() || "anonymous"
  return `${scope}:ip:${ip}`
}

export function rateLimit(
  req: NextRequest,
  scope: string,
  config: RateLimitConfig,
  userId?: string,
): RateLimitResult {
  const key = getClientKey(req, scope, userId)
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.resetAt < now) {
    const reset = now + config.windowMs
    buckets.set(key, { count: 1, resetAt: reset })
    return { ok: true, remaining: config.max - 1, resetAt: reset }
  }

  if (bucket.count >= config.max) {
    return { ok: false, remaining: 0, resetAt: bucket.resetAt }
  }

  bucket.count += 1
  return { ok: true, remaining: config.max - bucket.count, resetAt: bucket.resetAt }
}

/**
 * Wrap a route handler. Returns 429 if exceeded.
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse | null {
  if (result.ok) return null
  const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))
  return NextResponse.json(
    { error: "Demasiadas peticiones. Inténtalo más tarde." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Reset": String(result.resetAt),
      },
    },
  )
}

// Lightweight cleanup: prune expired buckets occasionally to avoid memory growth.
let lastSweep = 0
const SWEEP_INTERVAL = 60_000 // 1 min
export function maybeSweep() {
  const now = Date.now()
  if (now - lastSweep < SWEEP_INTERVAL) return
  lastSweep = now
  for (const [k, b] of buckets) {
    if (b.resetAt < now) buckets.delete(k)
  }
}
