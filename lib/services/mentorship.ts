import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { calendarSlots } from "@/lib/mentorship-slots"

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
  timezone?: string
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
  /** HH:MM label in the mentor calendar timezone. */
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
  hold_expires_at: string | null
  timezone: string
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

  const mentor = await getMentor(mentorId)
  if (!mentor?.is_active) return []
  const [availability, blocked, busy] = await Promise.all([
    supabase.from("mentor_availability").select("day_of_week,start_time,end_time").eq("mentor_id",mentorId).eq("is_active",true),
    supabase.from("mentor_blocked_dates").select("blocked_date").eq("mentor_id",mentorId).gte("blocked_date",new Date(fromDate.getTime()-86_400_000).toISOString().slice(0,10)).lte("blocked_date",new Date(toDate.getTime()+86_400_000).toISOString().slice(0,10)),
    supabase.rpc("mentor_busy_intervals", { p_mentor_id: mentorId, p_from: fromDate.toISOString(), p_to: toDate.toISOString() }),
  ])
  if (availability.error || blocked.error || busy.error) throw new Error("No se pudo consultar la disponibilidad.")
  return calendarSlots({ from: fromDate, to: toDate, now: Date.now(), duration: sessionDurationMinutes,
    zone: mentor.timezone ?? "Europe/Madrid", availability: availability.data ?? [],
    blocked: (blocked.data ?? []).map(row => row.blocked_date), busy: busy.data ?? [] })
}

export async function getUserMentorshipSessions(
  userId: string,
): Promise<MentorshipSessionRecord[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("mentorship_sessions")
    .select("id,mentor_id,user_id,scheduled_at,duration_minutes,status,meeting_link,user_notes,payment_reference,created_at,hold_expires_at,mentors(timezone)")
    .eq("user_id", userId)
    .order("scheduled_at", { ascending: false })
  return (data ?? []).map(row => { const mentor = Array.isArray(row.mentors) ? row.mentors[0] : row.mentors; return { ...row,timezone: mentor?.timezone ?? "Europe/Madrid" } }) as MentorshipSessionRecord[]
}
