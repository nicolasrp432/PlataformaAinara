import { createClient } from "@/lib/supabase/server"
import { SettingsClient } from "./settings-client"

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: settings } = await supabase
    .from("platform_settings")
    .select("key, value, label, description")
    .order("key")

  return <SettingsClient settings={settings ?? []} />
}
