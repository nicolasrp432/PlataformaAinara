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
 * Selector de estado. En móvil va a 3 columnas (antes eran 5 fijas, lo que
 * dejaba ~60px por botón y partía etiquetas como "En calma").
 */
export function MoodPicker({ value, onChange, disabled }: MoodPickerProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">
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
              "flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-xl border px-1 py-3 transition-all",
              "disabled:opacity-60",
              selected
                ? "border-primary/50 bg-primary/10 ring-2 ring-primary/30 shadow-sm"
                : "border-border/50 bg-background/40 hover:border-primary/25 hover:bg-primary/5"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 sm:h-6 sm:w-6",
                selected ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span
              className={cn(
                "text-[11px] leading-none sm:text-xs",
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
