import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// POST - Enroll user in a formation
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const body = await request.json()
  const { formationId } = body
  
  if (!formationId) {
    return NextResponse.json({ error: "Missing formationId" }, { status: 400 })
  }
  
  // Check if formation exists and is published
  const { data: formation, error: formationError } = await supabase
    .from("formations")
    .select("id, is_premium, is_published")
    .eq("id", formationId)
    .single()
  
  if (formationError || !formation) {
    return NextResponse.json({ error: "Formation not found" }, { status: 404 })
  }
  
  if (!formation.is_published) {
    return NextResponse.json({ error: "Formation not available" }, { status: 403 })
  }
  
  // Check if already enrolled
  const { data: existing } = await supabase
    .from("enrollments")
    .select("id")
    .eq("user_id", user.id)
    .eq("formation_id", formationId)
    .single()
  
  if (existing) {
    return NextResponse.json({ message: "Already enrolled", enrollment: existing })
  }
  
  // TODO: Check if user has access to premium content (subscription check)
  // For now, allow all enrollments
  
  // Create enrollment
  const { data: enrollment, error: enrollError } = await supabase
    .from("enrollments")
    .insert({
      user_id: user.id,
      formation_id: formationId,
      status: "active",
      enrolled_at: new Date().toISOString(),
    })
    .select()
    .single()
  
  if (enrollError) {
    return NextResponse.json({ error: enrollError.message }, { status: 500 })
  }
  
  return NextResponse.json({ enrollment })
}

// DELETE - Unenroll user from a formation
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const { searchParams } = new URL(request.url)
  const formationId = searchParams.get("formationId")
  
  if (!formationId) {
    return NextResponse.json({ error: "Missing formationId" }, { status: 400 })
  }
  
  const { error } = await supabase
    .from("enrollments")
    .delete()
    .eq("user_id", user.id)
    .eq("formation_id", formationId)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}
