import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getStripe } from "@/lib/stripe"
import { BillingClient } from "./billing-client"

export const metadata = { title: "Suscripción" }

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, stripe_customer_id")
    .eq("id", user.id)
    .single()

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  let portalUrl: string | null = null
  if (profile?.stripe_customer_id) {
    try {
      const stripe = getStripe()
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
      const session = await stripe.billingPortal.sessions.create({
        customer: profile.stripe_customer_id,
        return_url: `${baseUrl}/billing`,
      })
      portalUrl = session.url
    } catch {
      // Customer portal not configured yet — no-op
    }
  }

  return (
    <BillingClient
      subscription={subscription}
      portalUrl={portalUrl}
      userEmail={user.email ?? ""}
    />
  )
}
