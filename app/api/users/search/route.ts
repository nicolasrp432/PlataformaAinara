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
    const trimmed = query.trim().replace(/[%_]/g, " ").slice(0, 80)

    if (!trimmed) {
      // Sugerencias iniciales: exploradores activos de la comunidad (excluyendo al usuario actual)
      const { data: suggestions, error: suggestError } = await supabase
        .from("member_profiles")
        .select("id, full_name, avatar_url, level, xp, role, allow_direct_messages")
        .neq("id", user.id)
        .neq("profile_visibility", "private")
        .order("xp", { ascending: false })
        .limit(6)

      if (suggestError) {
        return NextResponse.json({ users: [] })
      }
      return NextResponse.json({ users: suggestions || [], isSuggested: true })
    }

    // Consultar perfiles en la base de datos que coincidan con la búsqueda
    // Excluir al usuario actual y perfiles privados
    const { data: profiles, error } = await supabase
      .from("member_profiles")
      .select("id, full_name, avatar_url, level, xp, role, allow_direct_messages")
      .neq("id", user.id)
      .neq("profile_visibility", "private")
      .ilike("full_name", `%${trimmed}%`)
      .order("xp", { ascending: false })
      .limit(10)

    if (error) {
      console.error("Error searching users in DB:", error)
      return NextResponse.json({ error: "Error al buscar usuarios" }, { status: 500 })
    }

    return NextResponse.json({ users: profiles || [], isSuggested: false })
  } catch (err) {
    console.error("User search internal error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
