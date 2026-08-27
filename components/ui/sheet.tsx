"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import {
  AnimatePresence,
  motion,
  useDragControls,
  useReducedMotion,
  type PanInfo,
} from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { SPRING_SHEET, projectMomentum } from "@/lib/motion"

/* ------------------------------------------------------------------ *
 * Contexto
 *
 * Necesitamos conocer `open` dentro de SheetContent para poder montar
 * y desmontar con AnimatePresence. Radix no lo expone hacia abajo, así
 * que envolvemos su Root y lo propagamos nosotros.
 * ------------------------------------------------------------------ */

interface SheetContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const SheetContext = React.createContext<SheetContextValue>({
  open: false,
  setOpen: () => {},
})

type SheetProps = React.ComponentPropsWithoutRef<typeof SheetPrimitive.Root>

function Sheet({ open, defaultOpen, onOpenChange, children, ...props }: SheetProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen ?? false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : uncontrolled

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolled(next)
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange]
  )

  return (
    <SheetContext.Provider value={{ open: isOpen, setOpen }}>
      <SheetPrimitive.Root open={isOpen} onOpenChange={setOpen} {...props}>
        {children}
      </SheetPrimitive.Root>
    </SheetContext.Provider>
  )
}

const SheetTrigger = SheetPrimitive.Trigger
const SheetClose = SheetPrimitive.Close
const SheetPortal = SheetPrimitive.Portal

/* ------------------------------------------------------------------ *
 * Contenido
 * ------------------------------------------------------------------ */

type SheetSide = "bottom" | "right" | "left"

const sideStyles: Record<SheetSide, string> = {
  bottom: "inset-x-0 bottom-0 rounded-t-2xl border-t max-h-[85vh]",
  right: "inset-y-0 right-0 h-full w-3/4 max-w-sm border-l",
  left: "inset-y-0 left-0 h-full w-3/4 max-w-sm border-r",
}

/**
 * Entrada y salida recorren el mismo camino (§7). Un panel que entra
 * por la derecha se va por la derecha; nunca se desvanece en el sitio.
 * Las curvas son espejo la una de la otra.
 */
const sideVariants: Record<SheetSide, { hidden: Record<string, string> }> = {
  bottom: { hidden: { y: "100%" } },
  right: { hidden: { x: "100%" } },
  left: { hidden: { x: "-100%" } },
}

/** Umbral de descarte: fracción de la altura del sheet. */
const DISMISS_RATIO = 0.4
/** Velocidad de descarte inmediato, px/s. */
const DISMISS_VELOCITY = 650

interface SheetContentProps
  extends Omit<React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>, "onDrag" | "onDragEnd" | "onDragStart" | "onAnimationStart"> {
  side?: SheetSide
  /**
   * Muestra el asa de arrastre. Sólo tiene sentido en sheets inferiores
   * y sólo se pinta si el sheet es realmente arrastrable: un asa que no
   * arrastra es una promesa que la interfaz no cumple.
   */
  showGrabber?: boolean
  /** Permite descartar arrastrando hacia abajo. Sólo sheets inferiores. */
  dismissible?: boolean
  /**
   * Clases para el área de contenido con scroll. El `className` del
   * componente va al contenedor exterior (tamaño, fondo, esquinas);
   * el relleno interior vive aquí porque tiene que desplazarse con el
   * contenido, no recortarlo.
   */
  contentClassName?: string
}

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  (
    {
      className,
      children,
      side = "bottom",
      showGrabber = true,
      dismissible = true,
      contentClassName,
      ...props
    },
    forwardedRef
  ) => {
    const { open, setOpen } = React.useContext(SheetContext)
    const prefersReducedMotion = useReducedMotion()

    const contentRef = React.useRef<HTMLDivElement | null>(null)
    const overlayRef = React.useRef<HTMLDivElement | null>(null)
    const heightRef = React.useRef(600)
    const dragControls = useDragControls()

    // El sheet sólo se arrastra si es inferior, es descartable y el
    // usuario no ha pedido movimiento reducido.
    const canDrag = side === "bottom" && dismissible && !prefersReducedMotion
    const grabberVisible = side === "bottom" && showGrabber && canDrag

    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        contentRef.current = node
        if (typeof forwardedRef === "function") forwardedRef(node)
        else if (forwardedRef) forwardedRef.current = node
      },
      [forwardedRef]
    )

    function startDrag(event: React.PointerEvent) {
      if (!canDrag) return
      heightRef.current = contentRef.current?.offsetHeight ?? 600
      dragControls.start(event)
    }

    // El velo se aclara conforme el sheet baja: la respuesta es
    // continua durante todo el gesto, no sólo al soltar (§1).
    //
    // Se escribe el estilo a mano en vez de enlazar un MotionValue:
    // Framer ya es dueño de `opacity` en este elemento a través de
    // initial/animate/exit, y dos dueños para la misma propiedad
    // dejan la animación congelada a medio camino. Durante el
    // arrastre no hay ninguna animación corriendo sobre el velo, así
    // que escribir directamente es seguro.
    function handleDrag(_: unknown, info: PanInfo) {
      if (!overlayRef.current) return
      const progress = Math.min(Math.max(info.offset.y / heightRef.current, 0), 1)
      overlayRef.current.style.opacity = String(1 - progress * 0.75)
    }

    function handleDragEnd(_: unknown, info: PanInfo) {
      // No se decide por dónde quedó el dedo, sino por dónde iba: se
      // proyecta el punto de reposo con la velocidad de salida (§6).
      const projected = info.offset.y + projectMomentum(info.velocity.y)
      const shouldDismiss =
        projected > heightRef.current * DISMISS_RATIO ||
        info.velocity.y > DISMISS_VELOCITY

      // Se devuelve el control del velo a Framer.
      if (overlayRef.current) overlayRef.current.style.opacity = ""

      if (shouldDismiss) setOpen(false)
      // Si no se descarta, Framer devuelve el sheet a sus límites
      // arrastrando consigo la velocidad del gesto: sin costura entre
      // arrastrar y animar (§5).
    }

    const transition = prefersReducedMotion
      ? { duration: 0.15, ease: "easeOut" as const }
      : SPRING_SHEET

    return (
      <AnimatePresence>
        {open && (
          <SheetPortal forceMount>
            <SheetPrimitive.Overlay forceMount asChild>
              <motion.div
                ref={overlayRef}
                className="fixed inset-0 z-50 bg-black/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              />
            </SheetPrimitive.Overlay>

            <SheetPrimitive.Content forceMount asChild {...props}>
              <motion.div
                ref={setRefs}
                data-side={side}
                data-translucent=""
                className={cn(
                  "fixed z-50 flex flex-col gap-4 border-border bg-card shadow-lg",
                  sideStyles[side],
                  className
                )}
                initial={sideVariants[side].hidden}
                animate={{ x: 0, y: 0 }}
                exit={sideVariants[side].hidden}
                transition={transition}
                drag={canDrag ? "y" : false}
                dragControls={dragControls}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: 0 }}
                // Hacia abajo sigue al dedo 1:1 — es la dirección del
                // gesto. Hacia arriba resiste progresivamente en lugar
                // de topar en seco (§9).
                dragElastic={{ top: 0.04, bottom: 1 }}
                dragMomentum={false}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
              >
                {grabberVisible && (
                  // Zona de agarre de 44px: el asa es pequeña, el área
                  // táctil no puede serlo. `touch-none` evita que el
                  // navegador se quede el gesto para hacer scroll.
                  <div
                    onPointerDown={startDrag}
                    className="absolute inset-x-0 top-0 z-10 flex h-11 cursor-grab touch-none items-start justify-center pt-2.5 active:cursor-grabbing"
                    aria-hidden="true"
                  >
                    <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
                  </div>
                )}

                <div
                  className={cn(
                    "flex min-h-0 flex-auto flex-col gap-4 overflow-y-auto overscroll-contain p-4",
                    // El sheet inferior llega hasta el borde de la
                    // pantalla: el relleno tiene que esquivar la barra
                    // de gestos del iPhone.
                    side === "bottom" &&
                      "pb-[max(1rem,env(safe-area-inset-bottom))]",
                    grabberVisible && "pt-7",
                    contentClassName
                  )}
                >
                  {children}
                </div>

                <SheetPrimitive.Close className="absolute right-4 top-4 z-20 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Cerrar</span>
                </SheetPrimitive.Close>
              </motion.div>
            </SheetPrimitive.Content>
          </SheetPortal>
        )}
      </AnimatePresence>
    )
  }
)
SheetContent.displayName = "SheetContent"

/* ------------------------------------------------------------------ *
 * Piezas de composición
 * ------------------------------------------------------------------ */

const SheetOverlay = SheetPrimitive.Overlay

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex shrink-0 flex-col space-y-1.5 text-left", className)}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetTitle = React.forwardRef<
  React.ComponentRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-base font-medium text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ComponentRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
}
