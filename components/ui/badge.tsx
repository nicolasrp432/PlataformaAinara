import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  [
    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5",
    "text-xs font-semibold leading-none",
    "border transition-colors duration-150",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
  ],
  {
    variants: {
      variant: {
        // Gold: primary status, featured items
        default:
          "border-transparent bg-primary text-primary-foreground",

        // Champagne: secondary status
        secondary:
          "border-[oklch(0.62_0.13_74_/_0.25)] bg-secondary text-secondary-foreground",

        // Soft gold outline: neutral labels
        outline:
          "border-[oklch(0.62_0.13_74_/_0.35)] text-primary bg-transparent",

        // Error / destructive
        destructive:
          "border-transparent bg-destructive/15 text-destructive border-destructive/20",

        // Success
        success:
          "border-transparent bg-[oklch(0.55_0.14_148_/_0.15)] text-[oklch(0.40_0.14_148)] border-[oklch(0.55_0.14_148_/_0.25)]",

        // Warning / warm
        warning:
          "border-transparent bg-[oklch(0.70_0.13_78_/_0.15)] text-[oklch(0.45_0.12_74)] border-[oklch(0.70_0.13_78_/_0.25)]",

        // Premium: gradient gold
        premium:
          "border-transparent gold-gradient text-white shadow-sm font-bold tracking-wide",

        // Muted: very subtle
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
