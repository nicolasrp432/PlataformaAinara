import Link from "next/link"
import { ArrowLeft, Check, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UpgradeButton } from "@/components/access/upgrade-button"

interface LockedLessonProps {
  formationSlug: string
  formationTitle: string
  lessonTitle: string
}

const INCLUDED = [
  "Todas las lecciones de todas las formaciones",
  "Mentoría 1 a 1 y comunidad privada",
  "Certificados y seguimiento de tu progreso",
]

/**
 * Muro de pago de una lección.
 *
 * Deliberadamente NO dice «contenido bloqueado»: nombra la lección concreta
 * que hay detrás. Un muro que enseña lo que guarda convierte; uno que solo
 * dice que no, expulsa. El sello dorado sobre la línea de oro es el mismo
 * lenguaje visual que el resto de la plataforma, para que se lea como una
 * puerta de la casa y no como un error del sistema.
 */
export function LockedLesson({
  formationSlug,
  formationTitle,
  lessonTitle,
}: LockedLessonProps) {
  return (
    <div className="relative mx-auto flex min-h-[100dvh] max-w-lg flex-col justify-center px-4 py-12">
      {/* Halo cálido: se centra y nunca supera el ancho disponible. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/4 -z-10 h-80 w-[min(22rem,100%)] -translate-x-1/2 rounded-full bg-primary/10 blur-[110px]"
      />

      <Link
        href={`/formations/${formationSlug}`}
        className="mb-8 inline-flex items-center gap-2 self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        <span className="truncate">{formationTitle}</span>
      </Link>

      <div className="rounded-3xl border border-primary/20 bg-card/80 p-6 shadow-[0_16px_48px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:p-8">
        {/* Sello dorado */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl gold-gradient shadow-[0_8px_28px_rgba(246,210,92,0.4)]">
          <Lock className="h-7 w-7 text-[#2A2113]" aria-hidden />
        </div>

        <div className="gold-divider" />

        <div className="text-center">
          <p className="label-luxury">Siguiente lección</p>
          <h1 className="mt-2 text-balance text-2xl font-light leading-snug tracking-tight text-foreground sm:text-3xl">
            {lessonTitle}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Ya has visto la clase de muestra de{" "}
            <span className="font-medium text-foreground">{formationTitle}</span>.
            El resto del camino se abre con la suscripción.
          </p>
        </div>

        <ul className="mt-6 space-y-2.5">
          {INCLUDED.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15">
                <Check className="h-2.5 w-2.5 text-primary" aria-hidden />
              </span>
              <span className="text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-7 space-y-2">
          <UpgradeButton label="Desbloquear todo el contenido" />
          <Button variant="ghost" className="w-full text-muted-foreground" asChild>
            <Link href={`/formations/${formationSlug}`}>Ver el temario completo</Link>
          </Button>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Pago seguro con Stripe · Cancela cuando quieras
        </p>
      </div>
    </div>
  )
}
