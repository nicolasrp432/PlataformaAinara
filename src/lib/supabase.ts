// =====================================================
// Leader Blueprint - Supabase Client
// =====================================================

import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Supabase Configuration
export const SUPABASE_URL = 'https://suseccacxdfozgsxkmxx.supabase.co'
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1c2VjY2FjeGRmb3pnc3hrbXh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1ODk0MjYsImV4cCI6MjA4NDE2NTQyNn0.NzwBss08u_gl8aj809MNa0ZiNzVeSMvBQ6uZkaPpW1I'

// Create Supabase client
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// =====================================================
// Helper Types
// =====================================================

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Commonly used table types
export type Profile = Tables<'profiles'>
export type UserAccess = Tables<'user_access'>
export type UserStreak = Tables<'user_streaks'>
export type Formation = Tables<'formations'>
export type Module = Tables<'modules'>
export type Lesson = Tables<'lessons'>
export type UserProgress = Tables<'user_progress'>
export type Reflection = Tables<'reflections'>
export type Mentor = Tables<'mentors'>
export type MentorAvailability = Tables<'mentor_availability'>
export type MentorshipSession = Tables<'mentorship_sessions'>
export type Theme = Tables<'themes'>
export type UserTheme = Tables<'user_themes'>
export type Book = Tables<'books'>
export type UserBook = Tables<'user_books'>
export type Achievement = Tables<'achievements'>
export type UserAchievement = Tables<'user_achievements'>
export type XPLog = Tables<'xp_log'>

// =====================================================
// Auth Helpers
// =====================================================

/**
 * Get session from cookies or headers
 */
export async function getSession(c: any) {
  const authHeader = c.req.header('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const { data: { session }, error } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: '' // Minimal session restoration
    })
    if (!error && session) return session
  }

  // Check cookies
  const cookie = c.req.header('Cookie')
  if (cookie) {
    const sbToken = cookie.split('; ').find((row: string) => row.startsWith('sb-access-token='))?.split('=')[1]
    const sbRefresh = cookie.split('; ').find((row: string) => row.startsWith('sb-refresh-token='))?.split('=')[1]

    if (sbToken && sbRefresh) {
      const { data: { session }, error } = await supabase.auth.setSession({
        access_token: sbToken,
        refresh_token: sbRefresh
      })
      if (!error && session) return session
    }
  }

  return null
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error || !session) return null
  return session
}

export async function getUserProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) return null
  return data
}

export async function getUserAccess(userId: string): Promise<UserAccess | null> {
  const { data, error } = await supabase
    .from('user_access')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) return null
  return data
}

export async function getUserStreak(userId: string): Promise<UserStreak | null> {
  const { data, error } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) return null
  return data
}

// =====================================================
// Access Control Helpers
// =====================================================

export function hasPremiumAccess(access: UserAccess | null): boolean {
  if (!access) return false
  if (access.access_type === 'free') return false
  if (!access.is_active) return false
  if (access.expires_at && new Date(access.expires_at) < new Date()) return false
  return true
}

export function isAdmin(profile: Profile | null): boolean {
  return profile?.role === 'admin'
}

export function isMentor(profile: Profile | null): boolean {
  return profile?.role === 'mentor' || profile?.role === 'admin'
}
