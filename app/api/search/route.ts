import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { rateLimit, rateLimitResponse, maybeSweep } from "@/lib/rate-limit"

interface SearchResult {
  type: "formation" | "lesson"
  id: string
  title: string
  subtitle?: string
  href: string
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  maybeSweep()
  const rl = rateLimit(req, "search", { windowMs: 60_000, max: 60 }, user.id)
  const rlResp = rateLimitResponse(rl)
  if (rlResp) return rlResp

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get("q") ?? "").trim()
  if (q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const pattern = `%${q.replace(/[%_]/g, "\\$&")}%`

  const [{ data: formations }, { data: lessons }] = await Promise.all([
    supabase
      .from("formations")
      .select("id, title, slug")
      .ilike("title", pattern)
      .eq("is_published", true)
      .limit(5),
    supabase
      .from("lessons")
      .select("id, title, modules(id, formations(slug, title))")
      .ilike("title", pattern)
      .eq("is_published", true)
      .limit(8),
  ])

  const results: SearchResult[] = []

  for (const f of formations ?? []) {
    results.push({
      type: "formation",
      id: f.id,
      title: f.title,
      href: `/formations/${f.slug}`,
    })
  }

  for (const l of lessons ?? []) {
    const moduleRel = Array.isArray(l.modules) ? l.modules[0] : l.modules
    const formation = moduleRel
      ? Array.isArray(moduleRel.formations) ? moduleRel.formations[0] : moduleRel.formations
      : null
    if (!formation?.slug) continue
    results.push({
      type: "lesson",
      id: l.id,
      title: l.title,
      subtitle: formation.title,
      href: `/learn/${formation.slug}/${l.id}`,
    })
  }

  return NextResponse.json({ results })
}
