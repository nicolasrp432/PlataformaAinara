"use client"

import { useOptimistic, useTransition } from "react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { toggleReaction } from "@/app/(platform)/learn/[slug]/[lessonId]/actions"
import { REACTION_TYPES, type ReactionType } from "@/lib/validations/comments"

const REACTION_META: Record<ReactionType, { emoji: string; label: string }> = {
  heart: { emoji: "❤️", label: "Me encanta" },
  pray: { emoji: "🙏", label: "Gracias" },
  lightbulb: { emoji: "💡", label: "Me iluminó" },
  fire: { emoji: "🔥", label: "Inspirador" },
}

export type ReactionState = Record<string, { count: number; userReacted: boolean }>

interface ReactionBarProps {
  reflectionId: string
  reactions: ReactionState
  lessonId: string
  slug: string
}

type Action = { type: ReactionType }

export function ReactionBar({ reflectionId, reactions, lessonId, slug }: ReactionBarProps) {
  const [isPending, startTransition] = useTransition()

  const [optimistic, applyOptimistic] = useOptimistic<ReactionState, Action>(
    reactions,
    (state, action) => {
      const prev = state[action.type] ?? { count: 0, userReacted: false }
      return {
        ...state,
        [action.type]: {
          count: prev.userReacted ? Math.max(0, prev.count - 1) : prev.count + 1,
          userReacted: !prev.userReacted,
        },
      }
    },
  )

  const handleClick = (type: ReactionType) => {
    startTransition(async () => {
      applyOptimistic({ type })
      const result = await toggleReaction(reflectionId, type, lessonId, slug)
      if (result?.error) {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {REACTION_TYPES.map((type) => {
        const meta = REACTION_META[type]
        const state = optimistic[type] ?? { count: 0, userReacted: false }
        const isActive = state.userReacted
        const hasReactions = state.count > 0
        return (
          <button
            key={type}
            type="button"
            onClick={() => handleClick(type)}
            disabled={isPending}
            aria-label={meta.label}
            aria-pressed={isActive}
            className={cn(
              "group inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
              "hover:scale-[1.05] active:scale-95",
              isActive
                ? "bg-primary/15 border-primary/40 text-foreground shadow-sm"
                : "bg-background border-border/50 text-muted-foreground hover:bg-muted/50 hover:border-primary/20",
              isPending && "opacity-70 cursor-wait",
            )}
            title={meta.label}
          >
            <span className="text-base leading-none transition-transform group-hover:scale-110">
              {meta.emoji}
            </span>
            {hasReactions && <span className="tabular-nums">{state.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
