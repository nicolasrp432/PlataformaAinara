import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Base.
  //
  // `transform` es la única propiedad compositada de la lista; color y
  // background-color se pintan en el hilo principal. Se transicionan de
  // todas formas porque son baratas sobre superficies pequeñas, pero la
  // duración se mantiene corta para que no arrastren.
  //
  // El feedback de pulsación vive aquí, en la base, no en las variantes:
  // dos botones que se ven igual tienen que responder igual (§4).
  // `:active` dispara en pointer-down, que es donde debe estar (§1).
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "text-sm font-semibold leading-none select-none",
    "rounded-xl",
    "touch-manipulation", // elimina el retardo de ~300ms del tap en móvil
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    "transition-[transform,color,background-color,border-color,box-shadow,opacity]",
    "duration-150 ease-out",
    "active:scale-[0.97]",
  ],
  {
    variants: {
      variant: {
        // Primary: gold — main CTA
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",

        // Destructive
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",

        // Gold outline: secondary actions
        // El texto usa el oro oscuro: el de marca sobre marfil daba
        // 1.30:1. El borde sí puede llevar el oro claro.
        outline:
          "border border-border bg-transparent text-primary-strong hover:bg-secondary hover:border-primary/50",

        // Gray secondary
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm",

        // Ghost: subtle interactions
        ghost:
          "text-foreground hover:bg-muted hover:text-foreground/90",

        // Link: gold underline style
        // Un enlace no se ve como un botón, así que tampoco responde
        // como uno: se anula el escalado de la base a propósito.
        link:
          "text-primary-strong underline-offset-4 hover:underline p-0 h-auto active:scale-100",

        // Premium: gold gradient — hero CTAs
        premium:
          "gold-gradient text-primary-foreground shadow-md hover:shadow-lg hover:brightness-105 font-semibold tracking-wide",
      },
      // Alturas táctiles (≥44px) en móvil que se compactan en escritorio,
      // donde el puntero es preciso y la densidad importa más.
      size: {
        default: "h-11 px-5 py-2.5 md:h-10",
        sm:      "h-9 px-3 py-1.5 text-xs rounded-lg md:h-8",
        lg:      "h-12 px-7 py-3 text-base rounded-xl",
        xl:      "h-14 px-9 py-4 text-lg rounded-2xl",
        icon:    "h-11 w-11 md:h-10 md:w-10",
        "icon-sm": "h-9 w-9 md:h-8 md:w-8",
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
