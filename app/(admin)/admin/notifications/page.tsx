import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { NotificationsAdminClient } from "./notifications-client"
import { getNotificationCampaigns, getFormationsForAudience } from "./actions"

export const metadata = { title: "Notificaciones — Admin" }

export default async function AdminNotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (profile?.role !== "admin") redirect("/dashboard")

  const [campaigns, formations] = await Promise.all([
    getNotificationCampaigns(),
    getFormationsForAudience(),
  ])

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Notificaciones</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Envía mensajes in-app a grupos de usuarios o a toda la comunidad.
        </p>
      </div>
      <NotificationsAdminClient campaigns={campaigns} formations={formations} />
    </div>
  )
}
