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
          // Styling: warm ivory background, gold-tint border
          "rounded-[var(--radius)] border bg-background",
          "border-[oklch(0.86_0.028_72)] text-foreground",
          "placeholder:text-muted-foreground/60",
          // Focus: gold ring
          "focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-[oklch(0.62_0.13_74_/_0.50)] focus-visible:ring-offset-1",
          "focus-visible:border-primary",
          // Transitions
          "transition-colors duration-150",
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
