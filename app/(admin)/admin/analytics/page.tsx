import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  BookOpen,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  Video,
  Trophy,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Analíticas — Admin Ainara",
}

export const dynamic = "force-dynamic"

async function getAnalytics() {
  const supabase = await createClient()

  const [
    { count: totalUsers },
    { count: approvedUsers },
    { count: pendingUsers },
    { count: suspendedUsers },
    { count: totalFormations },
    { count: publishedFormations },
    { count: totalLessons },
    { count: totalEnrollments },
    { count: completedLessons },
    { data: topFormations },
    { data: recentEnrollments },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("access_status", "approved"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("access_status", "pending"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("access_status", "suspended"),
    supabase.from("formations").select("*", { count: "exact", head: true }),
    supabase.from("formations").select("*", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("lessons").select("*", { count: "exact", head: true }),
    supabase.from("enrollments").select("*", { count: "exact", head: true }),
    supabase.from("user_progress").select("*", { count: "exact", head: true }).eq("is_completed", true),
    supabase
      .from("enrollments")
      .select("formation_id, formations(title, is_published)")
      .limit(100),
    supabase
      .from("enrollments")
      .select("enrolled_at, formations(title)")
      .order("enrolled_at", { ascending: false })
      .limit(10),
  ])

  // Count enrollments per formation
  const formationCounts: Record<string, { title: string; count: number; published: boolean }> = {}
  if (topFormations) {
    for (const e of topFormations) {
      const fid = e.formation_id as string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = e.formations as any
      if (!formationCounts[fid]) {
        formationCounts[fid] = {
          title: f?.title ?? "Sin título",
          count: 0,
          published: f?.is_published ?? false,
        }
      }
      formationCounts[fid].count++
    }
  }

  const rankedFormations = Object.values(formationCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const completionRate =
    totalEnrollments && totalEnrollments > 0
      ? Math.round((completedLessons! / totalEnrollments!) * 100)
      : 0

  return {
    users: {
      total: totalUsers ?? 0,
      approved: approvedUsers ?? 0,
      pending: pendingUsers ?? 0,
      suspended: suspendedUsers ?? 0,
    },
    content: {
      formations: totalFormations ?? 0,
      published: publishedFormations ?? 0,
      lessons: totalLessons ?? 0,
    },
    engagement: {
      enrollments: totalEnrollments ?? 0,
      completedLessons: completedLessons ?? 0,
      completionRate,
    },
    topFormations: rankedFormations,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recentEnrollments: (recentEnrollments ?? []).map((e: any) => ({
      date: e.enrolled_at as string,
      formationTitle: e.formations?.title ?? "Sin título",
    })),
  }
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  accent,
}: {
  title: string
  value: number | string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  accent?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`rounded-lg p-2 ${accent ?? "bg-primary/10"}`}>
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default async function AdminAnalyticsPage() {
  const data = await getAnalytics()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analíticas</h1>
        <p className="text-muted-foreground">
          Métricas en tiempo real de la plataforma.
        </p>
      </div>

      {/* Users section */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Usuarios
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total registrados"
            value={data.users.total}
            icon={Users}
            accent="bg-primary/10"
          />
          <StatCard
            title="Con acceso aprobado"
            value={data.users.approved}
            description={`${data.users.total > 0 ? Math.round((data.users.approved / data.users.total) * 100) : 0}% del total`}
            icon={CheckCircle2}
            accent="bg-emerald-500/10"
          />
          <StatCard
            title="Pendientes de aprobación"
            value={data.users.pending}
            icon={Clock}
            accent="bg-amber-500/10"
          />
          <StatCard
            title="Suspendidos"
            value={data.users.suspended}
            icon={XCircle}
            accent="bg-rose-500/10"
          />
        </div>
      </div>

      {/* Content section */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Contenido
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Formaciones totales"
            value={data.content.formations}
            description={`${data.content.published} publicadas`}
            icon={BookOpen}
            accent="bg-blue-500/10"
          />
          <StatCard
            title="Lecciones totales"
            value={data.content.lessons}
            icon={Video}
            accent="bg-indigo-500/10"
          />
          <StatCard
            title="Inscripciones totales"
            value={data.engagement.enrollments}
            icon={TrendingUp}
            accent="bg-primary/10"
          />
        </div>
      </div>

      {/* Engagement section */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Engagement
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            title="Lecciones completadas"
            value={data.engagement.completedLessons.toLocaleString()}
            icon={Trophy}
            accent="bg-amber-500/10"
          />
          <StatCard
            title="Tasa de finalización"
            value={`${data.engagement.completionRate}%`}
            description="lecciones completadas / inscripciones"
            icon={CheckCircle2}
            accent="bg-emerald-500/10"
          />
        </div>
      </div>

      {/* Two-column section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top formations */}
        <Card>
          <CardHeader>
            <CardTitle>Formaciones más inscritas</CardTitle>
            <CardDescription>Top 5 por número de inscripciones</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topFormations.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aún no hay inscripciones
              </p>
            ) : (
              <div className="space-y-3">
                {data.topFormations.map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{f.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {f.count} inscripciones
                      </Badge>
                      {!f.published && (
                        <Badge variant="secondary" className="text-xs">
                          Borrador
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent enrollments */}
        <Card>
          <CardHeader>
            <CardTitle>Inscripciones recientes</CardTitle>
            <CardDescription>Últimas 10 inscripciones</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentEnrollments.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aún no hay inscripciones
              </p>
            ) : (
              <div className="space-y-3">
                {data.recentEnrollments.map((e, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm">{e.formationTitle}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(e.date)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
