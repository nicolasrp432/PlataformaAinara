import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import {
  createBulkNotifications,
  resolveAudience,
} from "@/lib/services/notifications"
import { phraseForDate } from "@/lib/daily-phrases"

export const dynamic = "force-dynamic"

/**
 * Cron diario (vercel.json → 07:00 UTC): envía la frase del día a todos
 * los usuarios como notificación in-app. Vercel añade automáticamente
 * `Authorization: Bearer ${CRON_SECRET}` cuando la env var está definida.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const now = new Date()
  const today = now.toISOString().slice(0, 10)

  // Idempotencia: si ya se envió la frase de hoy, no repetir.
  const admin = supabaseAdmin()
  const { count: alreadySent } = await admin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("kind", "system")
    .eq("metadata->>phrase_date", today)
    .limit(1)

  if (alreadySent && alreadySent > 0) {
    return NextResponse.json({ ok: true, skipped: true, phrase_date: today })
  }

  const phrase = phraseForDate(now)
  const userIds = await resolveAudience({ type: "all" })

  await createBulkNotifications(userIds, "system", {
    title: "Reflexión del día",
    body: phrase,
    link: "/reflexion",
    metadata: { phrase_date: today },
  })

  return NextResponse.json({
    ok: true,
    phrase_date: today,
    recipients: userIds.length,
  })
}
