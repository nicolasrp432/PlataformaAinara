"use client"

import useSWR from "swr"
import { api, ApiError } from "@/lib/api-client"
import type { User, UserStreak } from "@/types"

interface AuthData {
  user: User | null
  streak: UserStreak | null
  isLoading: boolean
  isError: boolean
  error: Error | null
  mutate: () => void
}

async function fetchUser() {
  try {
    const response = await api.getCurrentUser()
    if (response.success && response.data?.user) {
      return response.data.user
    }
    return null
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null
    }
    throw error
  }
}

async function fetchStreak() {
  try {
    const response = await api.getUserStreak()
    if (response.success && response.data) {
      return response.data
    }
    return null
  } catch {
    return null
  }
}

export function useAuth(): AuthData {
  const {
    data: user,
    error: userError,
    isLoading: userLoading,
    mutate: mutateUser,
  } = useSWR("auth-user", fetchUser, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })

  const {
    data: streak,
    isLoading: streakLoading,
  } = useSWR(user ? "auth-streak" : null, fetchStreak, {
    revalidateOnFocus: false,
  })

  return {
    user: user || null,
    streak: streak || null,
    isLoading: userLoading || streakLoading,
    isError: !!userError,
    error: userError || null,
    mutate: mutateUser,
  }
}

export function useRequireAuth() {
  const auth = useAuth()

  return {
    ...auth,
    isAuthenticated: !!auth.user && !auth.isLoading,
  }
}

export function useRequireAdmin() {
  const auth = useAuth()

  return {
    ...auth,
    isAdmin: auth.user?.role === "admin",
    isAuthorized: auth.user?.role === "admin" && !auth.isLoading,
  }
}
