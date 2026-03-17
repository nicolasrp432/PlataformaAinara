import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
  }
  return new Date(date).toLocaleDateString("es-ES", defaultOptions)
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`
  }
  return `${secs}s`
}

export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours > 0) {
    return `${hours}h ${mins > 0 ? `${mins}m` : ""}`
  }
  return `${mins}m`
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + "..."
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function calculateLevel(xp: number): number {
  // XP required per level increases: 100, 250, 450, 700, 1000...
  // Formula: level = floor(sqrt(xp / 50))
  return Math.floor(Math.sqrt(xp / 50)) + 1
}

export function xpForNextLevel(currentLevel: number): number {
  // XP needed to reach next level
  return Math.pow(currentLevel, 2) * 50
}

export function progressToNextLevel(xp: number, level: number): number {
  const currentLevelXp = Math.pow(level - 1, 2) * 50
  const nextLevelXp = Math.pow(level, 2) * 50
  const progress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
  return Math.min(100, Math.max(0, progress))
}
