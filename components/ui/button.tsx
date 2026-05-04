import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base: transitions only for composited properties (no layout thrash)
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "text-sm font-semibold leading-none select-none",
    "rounded-xl",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    "transition-colors duration-200 ease-out",
  ],
  {
    variants: {
      variant: {
        // Primary: gold — main CTA
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.98]",

        // Destructive
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",

        // Gold outline: secondary actions
        outline:
          "border border-border bg-transparent text-primary hover:bg-secondary hover:border-primary/50 active:scale-[0.98]",

        // Gray secondary
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",

        // Ghost: subtle interactions
        ghost:
          "text-foreground hover:bg-muted hover:text-foreground/90",

        // Link: gold underline style
        link:
          "text-primary underline-offset-4 hover:underline p-0 h-auto",

        // Premium: gold gradient — hero CTAs
        premium:
          "gold-gradient text-white shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.98] font-semibold tracking-wide",
      },
      size: {
        default: "h-10 px-5 py-2.5",
        sm:      "h-8 px-3 py-1.5 text-xs rounded-lg",
        lg:      "h-12 px-7 py-3 text-base rounded-xl",
        xl:      "h-14 px-9 py-4 text-lg rounded-2xl",
        icon:    "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
