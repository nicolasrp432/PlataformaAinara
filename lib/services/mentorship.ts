import { cache } from "react"
import { createClient } from "@/lib/supabase/server"

export interface MentorRecord {
  id: string
  name?: string | null
  full_name?: string | null
  title: string | null
  bio: string | null
  avatar_url: string | null
  specialties: string[] | null
  session_price: number | null
  session_duration_minutes: number | null
  is_active: boolean | null
}

export interface MentorAvailability {
  id: string
  mentor_id: string
  day_of_week: number
  start_time: string // HH:MM
  end_time: string   // HH:MM
  is_active: boolean | null
}

export interface AvailableSlot {
  /** ISO date-time string in UTC for the slot start. */
  startsAt: string
  /** HH:MM label in local user time. */
  label: string
  /** ISO date (YYYY-MM-DD) for grouping. */
  date: string
}

export interface MentorshipSessionRecord {
  id: string
  mentor_id: string
  user_id: string
  scheduled_at: string
  duration_minutes: number
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show"
  meeting_link: string | null
  notes: string | null
  user_notes: string | null
  payment_reference: string | null
  created_at: string
}

export const getMentor = cache(async (mentorId: string): Promise<MentorRecord | null> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from("mentors")
    .select("*")
    .eq("id", mentorId)
    .single()
  return (data as MentorRecord) ?? null
})

export const getDefaultMentor = cache(async (): Promise<MentorRecord | null> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from("mentors")
    .select("*")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle()
  return (data as MentorRecord) ?? null
})

/**
 * Compute available slots for a mentor in [fromDate, toDate] window.
 * Cross-checks: weekly availability, blocked dates, existing pending/confirmed sessions.
 *
 * Slots are generated at the session_duration_minutes interval.
 */
export async function getAvailableSlots(
  mentorId: string,
  fromDate: Date,
  toDate: Date,
  sessionDurationMinutes = 60,
): Promise<AvailableSlot[]> {
  const supabase = await createClient()

  const [{ data: availability }, { data: blocked }, { data: existing }] = await Promise.all([
    supabase
      .from("mentor_availability")
      .select("*")
      .eq("mentor_id", mentorId)
      .eq("is_active", true),
    supabase
      .from("mentor_blocked_dates")
      .select("blocked_date")
      .eq("mentor_id", mentorId),
    supabase
      .from("mentorship_sessions")
      .select("scheduled_at, duration_minutes, status")
      .eq("mentor_id", mentorId)
      .in("status", ["pending", "confirmed"])
      .gte("scheduled_at", fromDate.toISOString())
      .lte("scheduled_at", toDate.toISOString()),
  ])

  const blockedSet = new Set(
    (blocked || []).map((b: { blocked_date: string }) => b.blocked_date),
  )
  const takenSet = new Set(
    (existing || []).map((s: { scheduled_at: string }) => new Date(s.scheduled_at).toISOString()),
  )

  const availByDow = new Map<number, MentorAvailability[]>()
  for (const a of (availability || []) as MentorAvailability[]) {
    const arr = availByDow.get(a.day_of_week) ?? []
    arr.push(a)
    availByDow.set(a.day_of_week, arr)
  }

  const slots: AvailableSlot[] = []
  const cursor = new Date(fromDate)
  cursor.setHours(0, 0, 0, 0)

  while (cursor.getTime() <= toDate.getTime()) {
    const dow = cursor.getDay()
    const dateKey = cursor.toISOString().slice(0, 10)
    if (!blockedSet.has(dateKey)) {
      const slotsForDow = availByDow.get(dow) ?? []
      for (const a of slotsForDow) {
        const [sh, sm] = a.start_time.split(":").map(Number)
        const [eh, em] = a.end_time.split(":").map(Number)
        const startMinutes = sh * 60 + sm
        const endMinutes = eh * 60 + em
        for (
          let m = startMinutes;
          m + sessionDurationMinutes <= endMinutes;
          m += sessionDurationMinutes
        ) {
          const slotDate = new Date(cursor)
          slotDate.setHours(Math.floor(m / 60), m % 60, 0, 0)
          if (slotDate.getTime() <= Date.now()) continue
          const iso = slotDate.toISOString()
          if (takenSet.has(iso)) continue
          slots.push({
            startsAt: iso,
            label: `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`,
            date: dateKey,
          })
        }
      }
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return slots
}

export async function getUserMentorshipSessions(
  userId: string,
): Promise<MentorshipSessionRecord[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("mentorship_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("scheduled_at", { ascending: false })
  return (data as MentorshipSessionRecord[]) ?? []
}
