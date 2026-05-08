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

export function getInitials(name?: string | null): string {
  if (typeof name !== "string" || name.trim() === "") {
    return "U"
  }
  
  const parts = name.split(" ").filter(Boolean)
  if (parts.length === 0) return "U"
  
  return parts.map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

export function calculateLevel(xp: number): number {
  return Math.floor(xp / 500) + 1
}

export function xpForNextLevel(currentLevel: number): number {
  return currentLevel * 500
}

export function progressToNextLevel(xp: number, _level: number): number {
  return Math.min(100, Math.max(0, Math.round((xp % 500) / 5)))
}
