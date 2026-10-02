import Link from "next/link";
import { BookOpen, Users, Video, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/guards";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";

export function SectionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-hidden="true" className="space-y-4">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-12 rounded-lg shimmer" />
      ))}
    </div>
  );
}
export function StatsSkeleton() {
  return (
    <div className="admin-stat-grid" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="admin-stat">
          <div className="h-4 w-24 rounded shimmer" />
          <div className="mt-5 h-10 w-20 rounded shimmer" />
        </div>
      ))}
    </div>
  );
}

export async function AdminStats() {
  await requireAdmin();
  const supabase = await createClient();
  // Independent counts run together; no six-request waterfall.
  const results = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("enrollments").select("id", { count: "exact", head: true }),
    supabase.from("formations").select("id", { count: "exact", head: true }),
    supabase
      .from("formations")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true),
    supabase.from("lessons").select("id", { count: "exact", head: true }),
    supabase
      .from("user_progress")
      .select("id", { count: "exact", head: true })
      .eq("is_completed", true),
  ]);
  if (results.some((result) => result.error))
    return (
      <p role="alert" className="ainara-panel text-muted-foreground">
        No se pudieron cargar las cifras del panel. Vuelve a intentarlo.
      </p>
    );
  const [users, enrollments, formations, published, lessons, completed] =
    results;
  return (
    <div className="admin-stat-grid">
      {[
        {
          label: "Usuarios",
          value: users.count ?? 0,
          detail: "Cuentas registradas",
          icon: Users,
        },
        {
          label: "Inscripciones",
          value: enrollments.count ?? 0,
          detail: "En todas las formaciones",
          icon: TrendingUp,
        },
        {
          label: "Formaciones",
          value: formations.count ?? 0,
          detail: `${published.count ?? 0} publicadas`,
          icon: BookOpen,
        },
        {
          label: "Lecciones",
          value: lessons.count ?? 0,
          detail: `${(completed.count ?? 0).toLocaleString("es-ES")} completadas por usuarios`,
          icon: Video,
        },
      ].map((stat) => (
        <div key={stat.label} className="admin-stat">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span>{stat.label}</span>
            <stat.icon size={18} className="text-primary-strong" />
          </div>
          <p className="admin-stat-value">
            {stat.value.toLocaleString("es-ES")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{stat.detail}</p>
        </div>
      ))}
    </div>
  );
}
function dateLabel(date: string) {
  return new Date(date).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}
export async function RecentUsers() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id,full_name,role,created_at")
    .order("created_at", { ascending: false })
    .limit(5);
  if (error)
    return (
      <p role="alert" className="text-sm text-muted-foreground">
        No se pudo cargar la actividad de usuarios.
      </p>
    );
  if (!data?.length)
    return (
      <p className="py-6 text-sm text-muted-foreground">
        Todavía no hay cuentas registradas.
      </p>
    );
  return (
    <div>
      {data.map((user) => (
        <Link href="/admin/users" key={user.id} className="admin-row">
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary-strong">
              {getInitials(user.full_name || "Usuario")}
            </span>
            <span className="min-w-0">
              <strong className="block truncate text-sm">
                {user.full_name || "Sin nombre"}
              </strong>
              <span className="text-xs text-muted-foreground">
                {user.role === "admin"
                  ? "Administración"
                  : user.role === "mentor"
                    ? "Mentor"
                    : "Estudiante"}
              </span>
            </span>
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {dateLabel(user.created_at)}
          </span>
        </Link>
      ))}
    </div>
  );
}
export async function RecentFormations() {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("formations")
    .select("id,title,is_published")
    .order("updated_at", { ascending: false })
    .limit(5);
  if (error)
    return (
      <p role="alert" className="text-sm text-muted-foreground">
        No se pudo cargar el contenido reciente.
      </p>
    );
  if (!data?.length)
    return (
      <p className="py-6 text-sm text-muted-foreground">
        Crea tu primera formación para empezar.
      </p>
    );
  return (
    <div>
      {data.map((formation) => (
        <Link
          href={`/admin/content/formations/${formation.id}`}
          key={formation.id}
          className="admin-row"
        >
          <span className="flex min-w-0 items-center gap-3">
            <BookOpen size={18} className="shrink-0 text-primary-strong" />
            <strong className="truncate text-sm">{formation.title}</strong>
          </span>
          <Badge variant={formation.is_published ? "default" : "secondary"}>
            {formation.is_published ? "Publicada" : "Borrador"}
          </Badge>
        </Link>
      ))}
    </div>
  );
}
