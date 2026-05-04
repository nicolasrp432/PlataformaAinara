import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  [
    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5",
    "text-xs font-semibold leading-none",
    "border transition-colors duration-200",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
  ],
  {
    variants: {
      variant: {
        // Gold primary
        default:
          "border-transparent bg-primary text-primary-foreground",

        // Gray secondary
        secondary:
          "border-border bg-secondary text-secondary-foreground",

        // Gold outline
        outline:
          "border-primary/30 text-primary bg-transparent",

        // Destructive
        destructive:
          "border-transparent bg-destructive/15 text-destructive border-destructive/20",

        // Success
        success:
          "border-transparent bg-success/15 text-success border-success/20",

        // Warning
        warning:
          "border-transparent bg-warning/15 text-warning border-warning/20",

        // Premium: gold gradient
        premium:
          "border-transparent gold-gradient text-white shadow-sm font-bold tracking-wide",

        // Muted
        muted:
          "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
