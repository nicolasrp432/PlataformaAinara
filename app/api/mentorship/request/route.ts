import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { mentorshipRequestSchema } from "@/lib/validations/mentorship";
import { getAccessTier } from "@/lib/data-access";
import { hasFullAccess } from "@/lib/access";
import { rateLimit, rateLimitResponse, maybeSweep } from "@/lib/rate-limit";
export async function POST(req: NextRequest) {
  try {
    const client = await createClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
    if (!hasFullAccess(await getAccessTier(user.id)))
      return NextResponse.json(
        { error: "Necesitas acceso completo para solicitar mentoría." },
        { status: 403 },
      );
    const parsed = mentorshipRequestSchema.safeParse(
      await req.json().catch(() => null),
    );
    if (!parsed.success)
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message },
        { status: 400 },
      );
    maybeSweep();
    const limited = rateLimitResponse(
      rateLimit(
        req,
        "mentorship-request",
        { windowMs: 86_400_000, max: 3 },
        user.id,
      ),
    );
    if (limited) return limited;
    const { error } = await client
      .from("mentorship_requests")
      .insert({
        user_id: user.id,
        mentor_id: parsed.data.mentorId ?? null,
        notes: parsed.data.notes,
      });
    if (error)
      return NextResponse.json(
        { error: "No se pudo guardar tu solicitud. Inténtalo de nuevo." },
        { status: 503 },
      );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "No se pudo enviar la solicitud." },
      { status: 503 },
    );
  }
}
