import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createCertificatePdf } from "@/lib/certificate-pdf";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success)
    return NextResponse.json(
      { error: "Certificado inválido" },
      { status: 400 },
    );
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Inicia sesión" }, { status: 401 });
  // RLS restricts certificates to their owner or an administrator.
  const { data: cert, error } = await db
    .from("certificates")
    .select(
      "id,user_id,certificate_number,issued_at,profiles(full_name),formations(title)",
    )
    .eq("id", id)
    .single();
  if (error || !cert)
    return NextResponse.json(
      { error: "Certificado no encontrado" },
      { status: 404 },
    );
  if (cert.user_id !== user.id) {
    const { data: viewer } = await db
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (viewer?.role !== "admin")
      return NextResponse.json(
        { error: "Certificado no encontrado" },
        { status: 404 },
      );
  }
  const profile = Array.isArray(cert.profiles)
    ? cert.profiles[0]
    : cert.profiles;
  const formation = Array.isArray(cert.formations)
    ? cert.formations[0]
    : cert.formations;
  try {
    const bytes = await createCertificatePdf({
      userName: profile?.full_name || "Participante",
      formationTitle: formation?.title || "Formación",
      issuedAt: cert.issued_at,
      certificateNumber: cert.certificate_number,
    });
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificado-${id}.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo generar el PDF. Vuelve a intentarlo." },
      { status: 500 },
    );
  }
}
