import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check profile access status before deciding where to redirect
      const { data: profile } = await supabase
        .from("profiles")
        .select("access_status, role")
        .eq("id", data.user.id)
        .single()

      const accessStatus = profile?.access_status ?? "pending"
      const role = profile?.role ?? "student"
      const hasAccess =
        accessStatus === "approved" || role === "admin" || role === "mentor"

      const destination = hasAccess ? next : "/pending"
      return NextResponse.redirect(`${origin}${destination}`)
    }
  }

  // If there's an error, redirect to auth error page
  return NextResponse.redirect(`${origin}/auth/error?error=Could not authenticate user`)
}
