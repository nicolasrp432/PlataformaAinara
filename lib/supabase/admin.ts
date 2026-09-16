import { createClient } from "@supabase/supabase-js"

// Solo importar desde server actions y /api/admin/* — NUNCA en "use client"
export const supabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""

  if (!url || !key) {
    console.error("[supabaseAdmin] Faltan variables de entorno de Supabase")
  }

  return createClient(url, key, { auth: { persistSession: false } })
}

