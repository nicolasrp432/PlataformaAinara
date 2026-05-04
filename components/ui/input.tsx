import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base
          "flex h-10 w-full px-3.5 py-2 text-sm",
          // Styling: card-white bg at rest, warm border — per design system
          "rounded-xl border border-border bg-card",
          "text-foreground",
          "placeholder:text-muted-foreground/60",
          // Focus: gold border + ring
          "focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-primary/50 focus-visible:ring-offset-1",
          "focus-visible:border-primary focus-visible:bg-background",
          // Transitions
          "transition-colors duration-200",
          // File input reset
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          // Disabled
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
