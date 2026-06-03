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
  title: "Dashboard | Μήτρα",
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
          
          <div className="flex flex-col gap-6">
            <Card className="w-full border-border/50 bg-card/50 backdrop-blur-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
              <CardContent className="p-5 space-y-6">
                
                {/* SVG Activity Chart */}
                {(() => {
                  const weeklyXp = stats.weeklyXp || [0, 0, 0, 0, 0, 0, 0]
                  const totalWeeklyXp = weeklyXp.reduce((acc: number, curr: number) => acc + curr, 0)
                  const maxWeeklyXp = Math.max(...weeklyXp, 100)
                  const points = weeklyXp.map((xp, i) => {
                    const x = 5 + i * 15
                    const y = 35 - (xp / maxWeeklyXp) * 30
                    return { x, y, xp }
                  })
                  const linePath = points.reduce((path, p, i) => {
                    if (i === 0) return `M ${p.x} ${p.y}`
                    const prev = points[i - 1]
                    const cpX1 = prev.x + 7.5
                    const cpY1 = prev.y
                    const cpX2 = p.x - 7.5
                    const cpY2 = p.y
                    return `${path} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p.x} ${p.y}`
                  }, "")
                  const areaPath = `${linePath} L 95 40 L 5 40 Z`
                  const isXpActive = totalWeeklyXp > 0

                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Evolución de XP Semanal</p>
                        {isXpActive ? (
                          <span className="text-[10px] text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            +{totalWeeklyXp} XP esta semana
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">
                            Sin actividad
                          </span>
                        )}
                      </div>
                      <div className="h-[120px] w-full bg-background/40 rounded-xl p-3 border border-border/40 flex flex-col justify-between relative overflow-hidden">
                        <svg className="w-full h-[70px] mt-2 overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                            </linearGradient>
                            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="var(--primary)" />
                              <stop offset="100%" stopColor="#E2B755" />
                            </linearGradient>
                          </defs>
                          
                          {/* Grid Lines */}
                          <line x1="0" y1="10" x2="100" y2="10" stroke="currentColor" strokeWidth="0.1" className="text-muted-foreground/15" strokeDasharray="2,2" />
                          <line x1="0" y1="20" x2="100" y2="20" stroke="currentColor" strokeWidth="0.1" className="text-muted-foreground/15" strokeDasharray="2,2" />
                          <line x1="0" y1="30" x2="100" y2="30" stroke="currentColor" strokeWidth="0.1" className="text-muted-foreground/15" strokeDasharray="2,2" />
                          
                          {isXpActive ? (
                            <>
                              {/* Area under curve */}
                              <path d={areaPath} fill="url(#chartGrad)" />
                              
                              {/* Curve line */}
                              <path d={linePath} fill="none" stroke="url(#lineGrad)" strokeWidth="1.5" strokeLinecap="round" />
                              
                              {/* Interactive dots */}
                              {points.map((p, i) => (
                                p.xp > 0 && (
                                  <g key={i}>
                                    <circle cx={p.x} cy={p.y} r="2" fill="var(--primary)" />
                                    <circle cx={p.x} cy={p.y} r="4" fill="var(--primary)" className="opacity-20 animate-ping" />
                                  </g>
                                )
                              ))}
                            </>
                          ) : (
                            <>
                              {/* Flat baseline showing empty state */}
                              <line x1="5" y1="35" x2="95" y2="35" stroke="currentColor" strokeWidth="0.75" className="text-muted-foreground/30" strokeDasharray="3,3" />
                            </>
                          )}
                        </svg>
                        
                        <div className="flex justify-between text-[9px] text-muted-foreground/80 font-medium px-1">
                          <span>Lun</span>
                          <span>Mar</span>
                          <span>Mié</span>
                          <span>Jue</span>
                          <span>Vie</span>
                          <span>Sáb</span>
                          <span>Dom</span>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                <div className="h-px bg-border/40" />

                {/* Recent Activities List */}
                {recentAct.length > 0 ? (
                  <div className="space-y-4">
                    {recentAct.map((activity: RecentActivityItem, index: number) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 pb-4 last:pb-0 last:border-0 border-b border-border/50"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                          {activity.type === "lesson_completed" ? (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          ) : (
                            <Flame className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1 min-w-0">
                          <p className="text-sm font-medium leading-tight text-foreground truncate">
                            {activity.title}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className="text-[10px] bg-primary/10 text-primary border-0 font-bold px-2 py-0.5"
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
                      Aún no tienes actividad reciente. Comienza una lección para
                      ver tu progreso aquí.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="w-full border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">
                  Acciones Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
                  <Button
                    variant="outline"
                    className="justify-start border-border/50 hover:bg-primary/5 hover:border-primary/30 h-11 text-sm font-medium px-4"
                    asChild
                  >
                    <Link href="/library">
                      <BookOpen className="mr-2.5 h-4 w-4 text-primary shrink-0" />
                      Explorar Formaciones
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start border-border/50 hover:bg-primary/5 hover:border-primary/30 h-11 text-sm font-medium px-4"
                    asChild
                  >
                    <Link href="/taberna">
                      <Star className="mr-2.5 h-4 w-4 text-primary shrink-0" />
                      Nueva Reflexión
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start border-border/50 hover:bg-primary/5 hover:border-primary/30 h-11 text-sm font-medium px-4"
                    asChild
                  >
                    <Link href="/mentorship">
                      <Clock className="mr-2.5 h-4 w-4 text-primary shrink-0" />
                      Agendar Mentoría
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
