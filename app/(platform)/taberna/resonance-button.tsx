"use client"

import { useState, useTransition } from "react"
import { Heart } from "lucide-react"
import { resonarReflection } from "./actions"
import { cn } from "@/lib/utils"

interface ResonanceButtonProps {
  reflectionId: string
  initialCount: number
}

export function ResonanceButton({ reflectionId, initialCount }: ResonanceButtonProps) {
  const [count, setCount] = useState(initialCount)
  const [resonated, setResonated] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleResonar = () => {
    if (resonated || isPending) return
    setCount((c) => c + 1)
    setResonated(true)
    startTransition(async () => {
      try {
        const result = await resonarReflection(reflectionId)
        if (typeof result.count === "number") setCount(result.count)
        else { setCount(initialCount); setResonated(false) }
      } catch { setCount(initialCount); setResonated(false) }
    })
  }

  return (
    <button
      aria-label={`Resonar con esta reflexión. ${count} resonancias`}
      aria-pressed={resonated}
      onClick={handleResonar}
      disabled={resonated || isPending}
      className={cn(
        "flex items-center gap-2 text-xs font-medium transition-colors group/btn",
        resonated
          ? "text-primary cursor-default"
          : "text-muted-foreground hover:text-primary"
      )}
    >
      <Heart
        className={cn(
          "w-4 h-4 transition-[transform,background-color,border-color,color,box-shadow,opacity] duration-200",
          resonated
            ? "fill-primary text-primary scale-110"
            : "fill-transparent group-hover/btn:fill-primary/20"
        )}
      />
      <span>{count > 0 ? count : "Resonar"}</span>
    </button>
  )
}
