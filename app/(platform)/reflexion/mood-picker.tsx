"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { MOODS, MOOD_TONES } from "./moods"

interface MoodPickerProps {
  value: string | null
  onChange: (moodId: string) => void
  disabled?: boolean
}

export function MoodPicker({ value, onChange, disabled }: MoodPickerProps) {
  const selectedMood = MOODS.find((m) => m.id === value)
  return (
    <div className="space-y-3">
      <div role="group" aria-label="Elige tu clima emocional" className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {MOODS.map((m) => {
          const Icon = m.icon
          const selected = value === m.id
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(m.id)}
              disabled={disabled}
              aria-pressed={selected}
              className={cn(
                "relative flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 motion-reduce:transition-none",
                selected ? "border-current ring-1 ring-current shadow-sm" : "border-transparent hover:border-current",
                MOOD_TONES[m.id]
              )}
            >
              {selected && <Check aria-hidden="true" className="absolute right-2 top-2 h-3.5 w-3.5" />}
              <Icon aria-hidden="true" className="h-7 w-7" />
              <span className="text-xs font-semibold">{m.label}</span>
              <span className="text-[11px] leading-snug">{m.description}</span>
            </button>
          )
        })}
      </div>
      <div aria-live="polite" className="rounded-xl border border-border bg-muted/30 p-3 text-sm leading-relaxed">
        {selectedMood ? selectedMood.question : "No hay emociones buenas o malas. Elige el estado que más se acerque a lo que sientes; puedes cambiarlo antes de guardar."}
      </div>
    </div>
  )
}
