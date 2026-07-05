import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getAuthUser, getUserProfile } from "@/lib/data-access"
import { Clock, Sparkles, LogOut, Mail, ArrowRight } from "lucide-react"
import { BrandMark, Wordmark } from "@/components/ui/brand"

export const metadata: Metadata = {
  title: "Acceso pendiente",
}

export default async function PendingPage() {
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  const profile = await getUserProfile(user.id)

  // If already approved, redirect to dashboard
  if (profile?.access_status === "approved") {
    redirect("/dashboard")
  }

  const isSuspended = profile?.access_status === "suspended"

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Logo */}
      <Link href="/" className="mb-10 flex items-center gap-3">
        <BrandMark size="md" />
        <Wordmark size="md" />
      </Link>

      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardContent className="flex flex-col items-center px-8 py-10 text-center">
          {isSuspended ? (
            <>
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/10">
                <Mail className="h-10 w-10 text-rose-600" />
              </div>
              <h1 className="mb-3 text-2xl font-light">Acceso suspendido</h1>
              <p className="mb-6 text-muted-foreground leading-relaxed">
                Tu acceso a la plataforma ha sido suspendido. Si crees que esto es
                un error, por favor contacta con el equipo de soporte.
              </p>
              <Button variant="outline" asChild>
                <a href="mailto:soporte@mitra.com">
                  <Mail className="mr-2 h-4 w-4" />
                  Contactar soporte
                </a>
              </Button>
            </>
          ) : (
            <>
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10">
                <Clock className="h-10 w-10 text-amber-600" />
              </div>
              <h1 className="mb-3 text-2xl font-light">
                Tu cuenta está en revisión
              </h1>
              <p className="mb-2 text-muted-foreground leading-relaxed">
                Hola{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}. Hemos
                recibido tu registro y nuestro equipo está revisando tu solicitud de
                acceso.
              </p>
              <p className="mb-8 text-sm text-muted-foreground">
                Recibirás una notificación cuando tu acceso sea aprobado. Este proceso
                suele tardar menos de 24 horas.
              </p>

              <div className="w-full space-y-3">
                <Button
                  className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90"
                  size="lg"
                  asChild
                >
                  <Link href="/billing">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Activar acceso con suscripción
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <div className="rounded-xl border border-border/50 bg-muted/30 p-4 text-left">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    ¿Qué ocurre mientras esperas?
                  </p>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      El equipo revisa tu perfil y solicitud
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Si realizaste un pago, se verificará automáticamente
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Cuando sea aprobado, tendrás acceso completo
                    </li>
                  </ul>
                </div>
              </div>
            </>
          )}

          <div className="mt-8 w-full border-t border-border/50 pt-6">
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
              <Link href="/logout">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
