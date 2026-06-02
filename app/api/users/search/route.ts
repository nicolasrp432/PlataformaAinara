import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q") || ""
    const trimmed = query.trim()

    if (!trimmed) {
      return NextResponse.json({ users: [] })
    }

    // Consultar perfiles en la base de datos que coincidan con la búsqueda
    // Excluir perfiles privados
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, level, xp")
      .neq("profile_visibility", "private")
      .ilike("full_name", `%${trimmed}%`)
      .order("xp", { ascending: false })
      .limit(8)

    if (error) {
      console.error("Error searching users in DB:", error)
      return NextResponse.json({ error: "Error al buscar usuarios" }, { status: 500 })
    }

    return NextResponse.json({ users: profiles || [] })
  } catch (err) {
    console.error("User search internal error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
