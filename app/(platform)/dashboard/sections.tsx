import Link from "next/link"
import { MediaImage } from "@/components/media/media-image"
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
  CheckCircle2,
  Sparkles,
  NotebookPen,
  Quote,
  MessageSquare,
  Bot,
} from "lucide-react"
import {
  getUserProfile,
  getDashboardData,
  getFormationsInProgress,
  getRecentActivity,
  getDailyReflectionData,
} from "@/lib/data-access"
import { phraseForDate } from "@/lib/daily-phrases"
import { cn } from "@/lib/utils"

type RecentActivityItem = {
  type: "lesson_completed" | string
  title: string
  xp: number
  time: string
}

// ─── Banner de suscripción ────────────────────────────────────────────────

export async function UpsellBanner({ userId }: { userId: string }) {
  const profile = await getUserProfile(userId)

  const accessStatus = profile?.access_status ?? "pending"
  const role = profile?.role ?? "student"
  const hasFullAccess =
    accessStatus === "approved" || role === "admin" || role === "mentor"

  if (hasFullAccess) return null

  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
      <div className="flex items-center gap-3.5">
        <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm sm:text-base">
            Activa tu membresía para desbloquear todo el camino
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Formaciones en video, comunidad, cuaderno de autoconocimiento y mentoría personalizada.
          </p>
        </div>
      </div>
      <Button size="sm" className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 rounded-xl shadow-sm" asChild>
        <Link href="/billing">Activar acceso completo</Link>
      </Button>
    </div>
  )
}

// ─── Tarjetas de estadísticas ─────────────────────────────────────────────

/**
 * Carril del carrusel de estadísticas (solo móvil; desde `md` es rejilla).
 *
 * Las tres reglas que lo mantienen dentro de su sitio:
 *
 *  1. `-mx-4 px-4` — el carril sangra hasta los bordes de la pantalla pero su
 *     contenido sigue alineado con el resto de la página. El recorte de la
 *     tarjeta siguiente ocurre en el borde del móvil, que es donde se lee como
 *     "hay más a la derecha" y no como un fallo de maquetación.
 *  2. `overscroll-x-contain` — al llegar al final, el gesto muere aquí: no se
 *     encadena al documento ni dispara el "atrás" del navegador. Es lo que
 *     evita que el carrusel arrastre la página entera de lado.
 *  3. `scroll-px-4` + `snap-start` — el imán de scroll respeta el mismo margen
 *     de 16px, así que cada tarjeta encaja alineada con el título de la página.
 */
const STATS_RAIL =
  "-mx-4 flex snap-x snap-mandatory gap-3.5 overflow-x-auto overscroll-x-contain " +
  "scroll-px-4 px-4 pb-2 scrollbar-hide " +
  "md:mx-0 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-4"

/** Ancho de cada tarjeta dentro del carril: deja asomar la siguiente. */
const STATS_ITEM = "w-[72%] shrink-0 snap-start sm:w-[46%] md:w-auto"

export function StatsSkeleton() {
  return (
    <div className={STATS_RAIL}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            STATS_ITEM,
            "space-y-3 rounded-2xl border border-border/40 bg-card/40 p-5 backdrop-blur-sm"
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="h-4 w-full max-w-24 shimmer rounded-md" />
            <div className="h-4 w-4 shrink-0 shimmer rounded-full" />
          </div>
          <div className="h-7 w-20 max-w-full shimmer rounded-md" />
          <div className="h-3 w-32 max-w-full shimmer rounded-md" />
        </div>
      ))}
    </div>
  )
}

export async function StatsSection({ userId }: { userId: string }) {
  const { stats } = await getDashboardData(userId)

  const cardClass = cn(
    STATS_ITEM,
    "border-border/60 bg-card/60 backdrop-blur-md rounded-2xl shadow-sm hover:border-primary/30 transition-[transform,background-color,border-color,color,box-shadow,opacity]"
  )
  const titleClass =
    "min-w-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground"

  return (
    <div
      className={STATS_RAIL}
      role="group"
      aria-label="Resumen de tu progreso"
    >
      {/* Racha */}
      <Card className={cardClass}>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className={titleClass}>Racha Actual</CardTitle>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-warning-soft text-warning-strong">
            <Flame className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl sm:text-3xl font-bold text-foreground">
            {stats.currentStreak} <span className="text-base font-normal text-muted-foreground">días</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Práctica constante diaria</p>
        </CardContent>
      </Card>

      {/* XP & Nivel */}
      <Card className={cardClass}>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className={titleClass}>Experiencia & Nivel</CardTitle>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <Star className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl sm:text-3xl font-bold text-foreground">
            {stats.totalXp.toLocaleString()} <span className="text-xs font-semibold text-primary uppercase">XP</span>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-2xs">
              <span className="font-semibold text-muted-foreground">Nivel {stats.level}</span>
              <span className="font-bold text-primary">{stats.nextLevelProgress}%</span>
            </div>
            <Progress value={stats.nextLevelProgress} className="h-1.5" />
          </div>
        </CardContent>
      </Card>

      {/* Lecciones */}
      <Card className={cardClass}>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className={titleClass}>Lecciones</CardTitle>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-success-soft text-success-strong">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl sm:text-3xl font-bold text-foreground">
            {stats.lessonsCompleted}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Lecciones y ejercicios integrados</p>
        </CardContent>
      </Card>

      {/* Formaciones */}
      <Card className={cardClass}>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className={titleClass}>Formaciones</CardTitle>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <Trophy className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl sm:text-3xl font-bold text-foreground">
            {stats.formationsCompleted}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Completadas de {stats.formationsInProgress + stats.formationsCompleted} activas
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Continuar aprendiendo ────────────────────────────────────────────────

export function ContinueLearningSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <div
          key={i}
          className="space-y-3 rounded-2xl border border-border/40 bg-card/40 p-5"
        >
          <div className="h-5 w-3/4 shimmer rounded-md" />
          <div className="h-3 w-40 shimmer rounded-md" />
          <div className="h-2 w-full shimmer rounded-full" />
        </div>
      ))}
    </div>
  )
}

export async function ContinueLearningSection({ userId }: { userId: string }) {
  const formationsIP = await getFormationsInProgress(userId)

  if (formationsIP.length === 0) {
    return (
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm rounded-2xl shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-3">
            <BookOpen className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            No tienes formaciones en curso
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-md">
            Explora nuestra biblioteca de formaciones en video y comienza tu camino de transformación y autoconocimiento.
          </p>
          <Button className="mt-5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 rounded-xl shadow-sm" asChild>
            <Link href="/library">
              Explorar Formaciones
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {formationsIP.map((formation) => (
        <Card
          key={formation.id}
          className="border-border/60 bg-card/60 backdrop-blur-sm rounded-2xl shadow-sm hover:border-primary/40 hover:shadow-md transition-[transform,background-color,border-color,color,box-shadow,opacity] overflow-hidden"
        >
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link
                href={`/formations/${formation.slug}`}
                className="relative block w-full sm:w-36 aspect-video shrink-0 rounded-xl overflow-hidden bg-muted group"
              >
                <MediaImage
                  src={formation.thumbnailUrl}
                  alt={formation.title}
                  seed={formation.slug || formation.id}
                  fill
                  sizes="(max-width: 640px) 100vw, 144px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-9 h-9 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-lg">
                    <Play className="h-4 w-4 ml-0.5" />
                  </div>
                </div>
              </Link>

              <div className="flex-1 min-w-0 space-y-2 w-full">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-foreground text-base sm:text-lg leading-snug">
                      {formation.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formation.lessonsCompleted} de {formation.totalLessons} lecciones completadas
                    </p>
                  </div>
                  <span className="text-sm font-bold text-primary shrink-0">
                    {formation.progress}%
                  </span>
                </div>

                <div className="space-y-1">
                  <Progress value={formation.progress} className="h-2" />
                </div>
              </div>

              <Button asChild className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 rounded-xl shrink-0 shadow-sm">
                <Link href={`/formations/${formation.slug}`}>
                  <Play className="mr-1.5 h-4 w-4" />
                  Continuar
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ─── Tarjeta de Práctica Diaria / Reflexión ────────────────────────────────

export function CardSkeleton({ height = "h-32" }: { height?: string }) {
  return (
    <div className={`w-full ${height} shimmer rounded-2xl border border-border/30`} />
  )
}

export async function ReflexionCard({ userId }: { userId: string }) {
  const reflexion = await getDailyReflectionData(userId)
  const todayQuote = phraseForDate(new Date())

  return (
    <Card className="w-full border-primary/25 bg-gradient-to-b from-card/80 to-primary/5 backdrop-blur-md rounded-2xl shadow-sm overflow-hidden relative">
      <div className="absolute top-0 left-0 h-1 w-full gold-gradient" />
      <CardContent className="p-5 space-y-4">
        {/* Oráculo / Frase Semilla */}
        <div className="space-y-1.5 border-b border-border/40 pb-3.5">
          <div className="flex items-center gap-1.5 text-3xs uppercase tracking-widest font-bold text-primary">
            <Quote className="h-3.5 w-3.5" />
            <span>Semilla de Sabiduría de Hoy</span>
          </div>
          <p className="font-display text-sm sm:text-base italic leading-relaxed text-foreground/90">
            &ldquo;{todayQuote}&rdquo;
          </p>
        </div>

        {/* Estado de reflexión de hoy */}
        {reflexion.todayEntry ? (
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-soft text-success-strong">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Reflexión de hoy registrada
                </p>
                <p className="text-xs text-muted-foreground">
                  Racha de {reflexion.streak} {reflexion.streak === 1 ? "día" : "días"} de conexión interior
                </p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/5 rounded-xl text-xs shrink-0">
              <Link href="/reflexion">Ver diario</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <NotebookPen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Tu pausa de autoconocimiento
                </p>
                <p className="text-xs text-muted-foreground">
                  Toma 1 minuto para chequear cómo te sientes hoy (+XP).
                </p>
              </div>
            </div>
            <Button asChild size="sm" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-sm">
              <Link href="/reflexion">
                Escribir mi reflexión de hoy
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Gráfico semanal + actividad reciente ─────────────────────────────────

export async function ActivityCard({ userId }: { userId: string }) {
  const [{ stats }, recentAct] = await Promise.all([
    getDashboardData(userId),
    getRecentActivity(userId),
  ])

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
    return `${path} C ${prev.x + 7.5} ${prev.y}, ${p.x - 7.5} ${p.y}, ${p.x} ${p.y}`
  }, "")
  const areaPath = `${linePath} L 95 40 L 5 40 Z`
  const isXpActive = totalWeeklyXp > 0

  return (
    <Card className="w-full border-border/60 bg-card/60 backdrop-blur-md rounded-2xl shadow-sm relative overflow-hidden">
      <CardContent className="p-5 space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Evolución de XP Semanal
            </p>
            {isXpActive ? (
              <span className="text-3xs text-success-strong dark:text-success font-bold bg-success-soft px-2.5 py-0.5 rounded-full">
                +{totalWeeklyXp} XP esta semana
              </span>
            ) : (
              <span className="text-3xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">
                Sin actividad
              </span>
            )}
          </div>
          <div className="h-[120px] w-full bg-background/50 rounded-xl p-3 border border-border/50 flex flex-col justify-between relative overflow-hidden">
            <svg
              className="w-full h-[70px] mt-2 overflow-visible"
              viewBox="0 0 100 40"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="#E2B755" />
                </linearGradient>
              </defs>

              <line x1="0" y1="10" x2="100" y2="10" stroke="currentColor" strokeWidth="0.1" className="text-muted-foreground/15" strokeDasharray="2,2" />
              <line x1="0" y1="20" x2="100" y2="20" stroke="currentColor" strokeWidth="0.1" className="text-muted-foreground/15" strokeDasharray="2,2" />
              <line x1="0" y1="30" x2="100" y2="30" stroke="currentColor" strokeWidth="0.1" className="text-muted-foreground/15" strokeDasharray="2,2" />

              {isXpActive ? (
                <>
                  <path d={areaPath} fill="url(#chartGrad)" />
                  <path d={linePath} fill="none" stroke="url(#lineGrad)" strokeWidth="1.75" strokeLinecap="round" />
                  {points.map(
                    (p, i) =>
                      p.xp > 0 && (
                        <g key={i}>
                          <circle cx={p.x} cy={p.y} r="2.5" fill="var(--primary)" />
                          <circle cx={p.x} cy={p.y} r="5" fill="var(--primary)" className="opacity-25 animate-ping" />
                        </g>
                      )
                  )}
                </>
              ) : (
                <line x1="5" y1="35" x2="95" y2="35" stroke="currentColor" strokeWidth="0.75" className="text-muted-foreground/30" strokeDasharray="3,3" />
              )}
            </svg>

            <div className="flex justify-between text-3xs text-muted-foreground font-semibold px-1">
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

        <div className="h-px bg-border/40" />

        {recentAct.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Última Actividad
            </p>
            {recentAct.map((activity: RecentActivityItem, index: number) => (
              <div
                key={index}
                className="flex items-start gap-3 pb-3 last:pb-0 last:border-0 border-b border-border/40"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary shrink-0">
                  {activity.type === "lesson_completed" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Flame className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 space-y-0.5 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold leading-tight text-foreground truncate">
                    {activity.title}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="text-3xs bg-primary/15 text-primary border-0 font-bold px-2 py-0.5"
                    >
                      +{activity.xp} XP
                    </Badge>
                    <span className="text-2xs text-muted-foreground">
                      {activity.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-xs text-muted-foreground">
              Aún no tienes actividad reciente. ¡Comienza una lección para sumar XP!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Acciones rápidas ─────────────────────────────────────────────────────

export function QuickActions() {
  const linkClass =
    "justify-start border-border/60 bg-card/60 hover:bg-primary/10 hover:border-primary/40 h-11 text-xs sm:text-sm font-semibold px-4 rounded-xl shadow-sm transition-[transform,background-color,border-color,color,box-shadow,opacity]"

  return (
    <Card className="w-full border-border/60 bg-card/60 backdrop-blur-md rounded-2xl shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Herramientas & Atajos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2.5">
          <Button variant="outline" className={linkClass} asChild>
            <Link href="/library">
              <BookOpen className="mr-2.5 h-4 w-4 text-primary shrink-0" />
              Explorar Formaciones
            </Link>
          </Button>
          <Button variant="outline" className={linkClass} asChild>
            <Link href="/taberna">
              <MessageSquare className="mr-2.5 h-4 w-4 text-primary shrink-0" />
              Comunidad La Taberna
            </Link>
          </Button>
          <Button variant="outline" className={linkClass} asChild>
            <Link href="/assistant">
              <Bot className="mr-2.5 h-4 w-4 text-primary shrink-0" />
              Asistente de Aprendizaje IA
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
