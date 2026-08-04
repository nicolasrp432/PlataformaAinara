import type { Metadata } from "next"
import { Suspense } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/data-access"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import {
  UpsellBanner,
  StatsSection,
  StatsSkeleton,
  ContinueLearningSection,
  ContinueLearningSkeleton,
  ReflexionCard,
  ActivityCard,
  CardSkeleton,
  QuickActions,
} from "./sections"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Tu centro de control para el aprendizaje y transformacion",
}

/**
 * La página solo espera la identidad del usuario; todo lo demás se resuelve
 * dentro de fronteras de Suspense. Así la cabecera y la estructura aparecen
 * de inmediato y cada bloque entra en cuanto responde su consulta, en vez de
 * dejar la pantalla en blanco hasta que termina la más lenta.
 */
export default async function DashboardPage() {
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  const userName =
    user.user_metadata?.first_name || user.email?.split("@")[0] || "Viajero"

  return (
    <div className="space-y-8">
      <Suspense fallback={null}>
        <UpsellBanner userId={user.id} />
      </Suspense>

      {/* Header — sin datos que esperar: se pinta al instante */}
      <div>
        <h1 className="text-3xl font-light tracking-tight text-foreground">
          Bienvenido, <span className="font-medium">{userName}</span>
        </h1>
        <p className="text-muted-foreground">
          Continua tu viaje de transformacion personal.
        </p>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection userId={user.id} />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Continuar aprendiendo */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium">Continuar Aprendiendo</h2>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-primary hover:text-primary/80"
            >
              <Link href="/library">
                Ver todo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <Suspense fallback={<ContinueLearningSkeleton />}>
            <ContinueLearningSection userId={user.id} />
          </Suspense>
        </div>

        {/* Actividad reciente */}
        <div className="space-y-4">
          <h2 className="text-xl font-medium">Actividad Reciente</h2>

          <div className="flex flex-col gap-6">
            <Suspense fallback={<CardSkeleton height="h-28" />}>
              <ReflexionCard userId={user.id} />
            </Suspense>

            <Suspense fallback={<CardSkeleton height="h-80" />}>
              <ActivityCard userId={user.id} />
            </Suspense>

            <QuickActions />
          </div>
        </div>
      </div>
    </div>
  )
}
