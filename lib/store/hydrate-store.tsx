"use client"

import { useEffect } from "react"
import { useUserStore } from "./user-store"

interface HydrateStoreProps {
  xp: number
  level: number
  streakDays: number
  completedLessons: string[]
}

export function HydrateStore({ xp, level, streakDays, completedLessons }: HydrateStoreProps) {
  const { hydrate } = useUserStore()

  useEffect(() => {
    hydrate({ xp, level, streakDays, completedLessons })
  }, [xp, level, streakDays, completedLessons, hydrate])

  return null
}
