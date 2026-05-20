"use server"

import { markAsRead, markAllAsRead } from "@/lib/services/notifications"
import { createClient } from "@/lib/supabase/server"

export async function markNotificationRead(notificationId: string) {
  await markAsRead(notificationId)
}

export async function markAllNotificationsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await markAllAsRead(user.id)
}
