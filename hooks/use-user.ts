"use client"

import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export interface UserProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: "student" | "mentor" | "admin"
  level: number
  xp_total: number
  streak_days: number
  created_at: string
}

export interface UseUserReturn {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  error: Error | null
  mutate: () => void
}

async function fetchUser(): Promise<{ user: User | null; profile: UserProfile | null }> {
  const supabase = createClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { user: null, profile: null }
  }

  // Fetch profile from profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return { 
    user, 
    profile: profile as UserProfile | null 
  }
}

export function useUser(): UseUserReturn {
  const { data, error, isLoading, mutate } = useSWR("user", fetchUser, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
  })

  const user = data?.user ?? null
  const profile = data?.profile ?? null
  const isAuthenticated = !!user
  const isAdmin = user?.user_metadata?.role === "admin" || profile?.role === "admin"

  return {
    user,
    profile,
    isLoading,
    isAuthenticated,
    isAdmin,
    error: error ?? null,
    mutate,
  }
}
