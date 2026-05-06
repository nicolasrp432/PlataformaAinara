"use server"

import { createClient } from "@/lib/supabase/server"

export interface XPAwardResult {
  newXP: number
  newLevel: number
  streakDays: number
  leveledUp: boolean
}

export async function awardXP(
  userId: string,
  xpAmount: number
): Promise<XPAwardResult | null> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("xp, level, streak_days, last_activity_date")
    .eq("id", userId)
    .single()

  if (!profile) return null

  const previousLevel = profile.level || 1
  const newXP = (profile.xp || 0) + xpAmount
  const newLevel = Math.floor(newXP / 500) + 1
  const leveledUp = newLevel > previousLevel

  const todayStr = new Date().toISOString().split("T")[0]
  const lastStr = profile.last_activity_date
    ? new Date(profile.last_activity_date).toISOString().split("T")[0]
    : null

  let streakDays = profile.streak_days || 0
  if (lastStr !== todayStr) {
    const diffDays = lastStr
      ? Math.round(
          (new Date(todayStr).getTime() - new Date(lastStr).getTime()) /
            86400000
        )
      : 999
    streakDays = diffDays === 1 ? streakDays + 1 : 1
  }

  await supabase
    .from("profiles")
    .update({
      xp: newXP,
      level: newLevel,
      streak_days: streakDays,
      last_activity_date: new Date().toISOString(),
    })
    .eq("id", userId)

  return { newXP, newLevel, streakDays, leveledUp }
}
