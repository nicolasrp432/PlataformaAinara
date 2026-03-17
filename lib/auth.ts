import { cookies } from "next/headers"
import type { User, UserAccess, UserStreak } from "@/types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ""

export interface SessionData {
  user: User
  access: UserAccess | null
  streak: UserStreak | null
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("sb-access-token")?.value

  if (!token) {
    return null
  }

  try {
    // Fetch user data from API
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      headers: {
        Cookie: `sb-access-token=${token}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    if (!data.success || !data.data?.user) {
      return null
    }

    // Fetch streak data
    let streak: UserStreak | null = null
    try {
      const streakResponse = await fetch(`${API_BASE}/api/users/streak`, {
        headers: {
          Cookie: `sb-access-token=${token}`,
        },
        cache: "no-store",
      })

      if (streakResponse.ok) {
        const streakData = await streakResponse.json()
        streak = streakData.data || null
      }
    } catch {
      // Streak fetch failed, continue without it
    }

    return {
      user: data.data.user,
      access: data.data.access || null,
      streak,
    }
  } catch (error) {
    console.error("Session fetch error:", error)
    return null
  }
}

export async function getAdminSession(): Promise<SessionData | null> {
  const session = await getSession()

  if (!session) {
    return null
  }

  // Check if user is admin
  if (session.user.role !== "admin") {
    return null
  }

  return session
}

export function isAdmin(user: User | null): boolean {
  return user?.role === "admin"
}

export function isMentor(user: User | null): boolean {
  return user?.role === "mentor" || user?.role === "admin"
}

export function hasAccess(access: UserAccess | null): boolean {
  if (!access) return false
  if (!access.is_active) return false
  if (access.expires_at && new Date(access.expires_at) < new Date()) return false
  return true
}

export function hasPremiumAccess(access: UserAccess | null): boolean {
  if (!hasAccess(access)) return false
  return access?.access_type === "paid" || access?.access_type === "manual"
}
