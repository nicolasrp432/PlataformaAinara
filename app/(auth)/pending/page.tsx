import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getAuthUser, getUserProfile } from "@/lib/data-access"
import { resolveAccessTier } from "@/lib/access"
import { ShieldAlert, LogOut, Mail, ArrowRight, CreditCard } from "lucide-react"
import { BrandMark, Wordmark } from "@/components/ui/brand"
import { CONTROLLER } from "@/components/legal/legal-doc"

export const metadata: Metadata = {
  title: "Acceso suspendido",
}

/**
 * Antes esta página era la sala de espera obligatoria de todo registro nuevo.
 * Ya no: una cuenta recién creada entra directa a la plataforma. Aquí solo
 * llega quien tiene el acceso suspendido (una suscripción impagada o una
 * cuenta bloqueada), y siempre con una salida clara.
 */
export default async function PendingPage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const profile = await getUserProfile(user.id)
  const tier = resolveAccessTier({
    role: profile?.role,
    accessStatus: profile?.access_status,
    hasLifetimeAccess: profile?.has_lifetime_access,
  })

  if (tier !== "suspended") redirect("/dashboard")

  const firstName = profile?.full_name?.split(" ")[0]

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <Link href="/" className="mb-10 flex items-center gap-3">
        <BrandMark size="md" />
        <Wordmark size="md" />
      </Link>

      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardContent className="flex flex-col items-center px-6 py-10 text-center sm:px-8">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-warning-soft">
            <ShieldAlert className="h-10 w-10 text-warning-strong" aria-hidden />
          </div>

          <h1 className="mb-3 text-2xl font-light">
            Tu acceso está en pausa
          </h1>
          <p className="mb-8 leading-relaxed text-muted-foreground">
            Hola{firstName ? `, ${firstName}` : ""}. Tu suscripción no está
            activa ahora mismo, así que el contenido está en pausa. Se reactiva
            en cuanto se regularice el pago — tu progreso sigue guardado.
          </p>

          <div className="w-full space-y-3">
            <Button
              className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90"
              size="lg"
              asChild
            >
              <Link href="/billing">
                <CreditCard className="mr-2 h-4 w-4" aria-hidden />
                Reactivar mi suscripción
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
            </Button>

            <Button variant="outline" className="w-full" asChild>
              <a href={`mailto:${CONTROLLER.email}`}>
                <Mail className="mr-2 h-4 w-4" aria-hidden />
                Escribir a soporte
              </a>
            </Button>
          </div>

          <div className="mt-8 w-full border-t border-border/50 pt-6">
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
              <Link href="/logout">
                <LogOut className="mr-2 h-4 w-4" aria-hidden />
                Cerrar sesión
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
