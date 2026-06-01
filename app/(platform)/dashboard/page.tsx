import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  getAuthUser,
  getUserProfile,
  getDashboardData,
  getFormationsInProgress,
  getRecentActivity,
} from "@/lib/data-access"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  Flame,
  Star,
  Trophy,
  Play,
  ArrowRight,
  Clock,
  CheckCircle2,
  Sparkles,
} from "lucide-react"

type RecentActivityItem = {
  type: "lesson_completed" | string
  title: string
  xp: number
  time: string
}

export const metadata: Metadata = {
  title: "Dashboard | Sendero",
  description: "Tu centro de control para el aprendizaje y transformacion",
}

export default async function DashboardPage() {
  const user = await getAuthUser()

  if (!user) {
    redirect("/login")
  }

  // Queries paralelas, deduplicadas vía React.cache()
  const [profile, dashboardData, formationsIP, recentAct] = await Promise.all([
    getUserProfile(user.id),
    getDashboardData(user.id),
    getFormationsInProgress(user.id),
    getRecentActivity(user.id),
  ])

  const { stats } = dashboardData
  const userName =
    user.user_metadata?.first_name || user.email?.split("@")[0] || "Viajero"

  const accessStatus = profile?.access_status ?? "pending"
  const role = profile?.role ?? "student"
  const hasFullAccess = accessStatus === "approved" || role === "admin" || role === "mentor"

  return (
    <div className="space-y-8">
      {/* Banner upsell para usuarios sin suscripción */}
      {!hasFullAccess && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">
                Activa tu suscripción para desbloquear todo
              </p>
              <p className="text-xs text-muted-foreground">
                Formaciones, comunidad, mentoría y más — acceso completo a la plataforma
              </p>
            </div>
          </div>
          <Button size="sm" className="shrink-0 bg-primary hover:bg-primary/90" asChild>
            <Link href="/billing">Activar acceso</Link>
          </Button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-light tracking-tight text-foreground">
          Bienvenido, <span className="font-medium">{userName}</span>
        </h1>
        <p className="text-muted-foreground">
          Continua tu viaje de transformacion personal.
        </p>
      </div>

      {/* Stats Cards — en mobile se deslizan horizontalmente (scroll-snap) */}
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible md:pb-0">
        <Card className="min-w-[72%] sm:min-w-[45%] snap-start shrink-0 md:min-w-0 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Racha Actual
            </CardTitle>
            <Flame className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {stats.currentStreak} dias
            </div>
            <p className="text-xs text-muted-foreground">Mantente constante</p>
          </CardContent>
        </Card>

        <Card className="min-w-[72%] sm:min-w-[45%] snap-start shrink-0 md:min-w-0 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              XP Total
            </CardTitle>
            <Star className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {stats.totalXp.toLocaleString()}
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  Nivel {stats.level}
                </span>
                <span className="text-primary">
                  {stats.nextLevelProgress}%
                </span>
              </div>
              <Progress value={stats.nextLevelProgress} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-[72%] sm:min-w-[45%] snap-start shrink-0 md:min-w-0 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lecciones
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {stats.lessonsCompleted}
            </div>
            <p className="text-xs text-muted-foreground">Completadas</p>
          </CardContent>
        </Card>

        <Card className="min-w-[72%] sm:min-w-[45%] snap-start shrink-0 md:min-w-0 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Formaciones
            </CardTitle>
            <Trophy className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {stats.formationsCompleted}
            </div>
            <p className="text-xs text-muted-foreground">
              Completadas de{" "}
              {stats.formationsInProgress + stats.formationsCompleted}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Continue Learning */}
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

          <div className="space-y-4">
            {formationsIP.map((formation) => (
              <Card
                key={formation.id}
                className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-colors"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="font-medium text-foreground">
                          {formation.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {formation.lessonsCompleted} de{" "}
                          {formation.totalLessons} lecciones
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Progreso
                          </span>
                          <span className="font-medium text-primary">
                            {formation.progress}%
                          </span>
                        </div>
                        <Progress value={formation.progress} className="h-2" />
                      </div>
                    </div>
                    <Button
                      asChild
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Link href={`/formations/${formation.slug}`}>
                        <Play className="mr-2 h-4 w-4" />
                        Continuar
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {formationsIP.length === 0 && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mt-4 font-medium text-foreground">
                  No tienes formaciones en curso
                </h3>
                <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
                  Explora nuestra biblioteca y comienza tu primera formacion
                  para transformar tu vida
                </p>
                <Button
                  className="mt-6 bg-primary hover:bg-primary/90"
                  asChild
                >
                  <Link href="/library">Explorar Biblioteca</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h2 className="text-xl font-medium">Actividad Reciente</h2>
          {/* En mobile, Actividad y Acciones Rápidas se deslizan horizontalmente */}
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 md:flex-col md:overflow-visible md:pb-0">
          <Card className="min-w-[85%] snap-start shrink-0 md:min-w-0 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              {recentAct.length > 0 ? (
                <div className="space-y-4">
                  {recentAct.map((activity: RecentActivityItem, index: number) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 pb-4 last:pb-0 last:border-0 border-b border-border/50"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        {activity.type === "lesson_completed" ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <Flame className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-tight text-foreground">
                          {activity.title}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="text-xs bg-primary/10 text-primary border-0"
                          >
                            +{activity.xp} XP
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {activity.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    Aun no tienes actividad reciente. Comienza una leccion para
                    ver tu progreso aqui.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="min-w-[85%] snap-start shrink-0 md:min-w-0 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">
                Acciones Rapidas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start border-border/50 hover:bg-primary/5 hover:border-primary/30"
                asChild
              >
                <Link href="/library">
                  <BookOpen className="mr-2 h-4 w-4 text-primary" />
                  Explorar Formaciones
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-border/50 hover:bg-primary/5 hover:border-primary/30"
                asChild
              >
                <Link href="/taberna">
                  <Star className="mr-2 h-4 w-4 text-primary" />
                  Nueva Reflexion
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-border/50 hover:bg-primary/5 hover:border-primary/30"
                asChild
              >
                <Link href="/mentorship">
                  <Clock className="mr-2 h-4 w-4 text-primary" />
                  Agendar Mentoria
                </Link>
              </Button>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
