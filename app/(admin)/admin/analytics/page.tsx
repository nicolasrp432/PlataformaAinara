import { Suspense } from "react";
import { requireAdmin } from "@/lib/guards";
import {
  progressCompletionPercentage,
  rankFormations,
  type FormationEnrollmentCount,
} from "@/lib/admin-analytics";
import { SectionSkeleton } from "../overview-sections";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  BookOpen,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  Video,
  Trophy,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Analíticas — Admin",
};

export const dynamic = "force-dynamic";

async function getFormationRanking(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  // Aggregate counts in Postgres; transfer one row per formation, not enrollment.
  // Page through the full catalog so the ranking never samples the first 100 rows.
  const rows: FormationEnrollmentCount[] = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await supabase
      .from("formations")
      .select("id,title,is_published,enrollments(count)")
      .order("id")
      .range(from, from + 499);
    if (error) throw new Error("No se pudo cargar el ranking de formaciones.");
    rows.push(...((data ?? []) as FormationEnrollmentCount[]));
    if (!data || data.length < 500) break;
  }
  return rankFormations(rows);
}

async function getAnalytics() {
  await requireAdmin();
  const supabase = await createClient();
  const [counts, topFormations, recent] = await Promise.all([
    Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("access_status", "approved"),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("access_status", "pending"),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("access_status", "suspended"),
      supabase.from("formations").select("id", { count: "exact", head: true }),
      supabase
        .from("formations")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true),
      supabase.from("lessons").select("id", { count: "exact", head: true }),
      supabase.from("enrollments").select("id", { count: "exact", head: true }),
      supabase
        .from("user_progress")
        .select("id", { count: "exact", head: true })
        .eq("is_completed", true),
      supabase
        .from("user_progress")
        .select("id", { count: "exact", head: true }),
    ]),
    getFormationRanking(supabase),
    supabase
      .from("enrollments")
      .select("enrolled_at,formations(title)")
      .order("enrolled_at", { ascending: false })
      .limit(10),
  ]);
  if (counts.some((result) => result.error) || recent.error)
    throw new Error("No se pudieron cargar las analíticas.");
  const [
    totalUsers,
    approvedUsers,
    pendingUsers,
    suspendedUsers,
    totalFormations,
    publishedFormations,
    totalLessons,
    totalEnrollments,
    completedLessons,
    recordedLessons,
  ] = counts.map((result) => result.count ?? 0);
  return {
    users: {
      total: totalUsers,
      approved: approvedUsers,
      pending: pendingUsers,
      suspended: suspendedUsers,
    },
    content: {
      formations: totalFormations,
      published: publishedFormations,
      lessons: totalLessons,
    },
    engagement: {
      enrollments: totalEnrollments,
      completedLessons,
      completionRate: progressCompletionPercentage(
        completedLessons,
        recordedLessons,
      ),
    },
    topFormations,
    recentEnrollments: (recent.data ?? []).map((entry) => {
      const formation = Array.isArray(entry.formations)
        ? entry.formations[0]
        : entry.formations;
      return {
        date: entry.enrolled_at,
        formationTitle: formation?.title ?? "Sin título",
      };
    }),
  };
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  accent,
}: {
  title: string;
  value: number | string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
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
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function AnalyticsContent() {
  const data = await getAnalytics();

  return (
    <div className="space-y-8">
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
            title="Con suscripción"
            value={data.users.approved}
            description={`${data.users.total > 0 ? Math.round((data.users.approved / data.users.total) * 100) : 0}% del total`}
            icon={CheckCircle2}
            accent="bg-success-soft"
          />
          <StatCard
            title="Sin suscripción activa"
            value={data.users.pending}
            icon={Clock}
            accent="bg-warning-soft"
          />
          <StatCard
            title="Suspendidos"
            value={data.users.suspended}
            icon={XCircle}
            accent="bg-danger-soft"
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
            accent="bg-warning-soft"
          />
          <StatCard
            title="Progreso completado"
            value={`${data.engagement.completionRate}%`}
            description="Registros de progreso finalizados / registrados"
            icon={CheckCircle2}
            accent="bg-success-soft"
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
                  <div key={f.id} className="flex items-center gap-3">
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
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2"
                  >
                    <p className="min-w-0 flex-1 truncate text-sm">
                      {e.formationTitle}
                    </p>
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
  );
}

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-8">
      <header className="ainara-page-header">
        <p className="ainara-eyebrow">ACTIVIDAD / APRENDIZAJE</p>
        <h1>Una mirada a lo que sucede.</h1>
        <p>Usuarios, inscripciones y progreso registrado en la plataforma.</p>
      </header>
      <Suspense
        fallback={
          <div className="ainara-panel">
            <SectionSkeleton rows={6} />
          </div>
        }
      >
        <AnalyticsContent />
      </Suspense>
    </div>
  );
}
