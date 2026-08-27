"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { MOODS } from "./moods"

interface MoodPickerProps {
  value: string | null
  onChange: (moodId: string) => void
  disabled?: boolean
}

/**
 * Selector de clima emocional. Iconos intuitivos con etiquetas claras y bordes suaves.
 */
export function MoodPicker({ value, onChange, disabled }: MoodPickerProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-2.5">
      {MOODS.map((m) => {
        const Icon = m.icon
        const selected = value === m.id
        return (
          <motion.button
            key={m.id}
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => onChange(m.id)}
            disabled={disabled}
            aria-pressed={selected}
            className={cn(
              "flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2.5 transition-[transform,background-color,border-color,color,box-shadow,opacity]",
              "disabled:opacity-50",
              selected
                ? "border-primary bg-primary/15 ring-2 ring-primary/30 shadow-sm"
                : "border-border bg-card/60 hover:border-primary/40 hover:bg-primary/5"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                selected ? "text-primary scale-110" : "text-muted-foreground"
              )}
            />
            <span
              className={cn(
                "text-2xs leading-none",
                selected ? "font-semibold text-foreground" : "text-muted-foreground"
              )}
            >
              {m.label}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
