import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/guards";
import { Button } from "@/components/ui/button";
import {
  ADMIN_PAGE_SIZE,
  parseAdminFilters,
  adminPageHref,
  type AdminSearchParams,
} from "@/lib/admin-pagination";
import { UsersTable } from "./users-table";
export const metadata: Metadata = { title: "Usuarios — Administración" };
export const dynamic = "force-dynamic";
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  await requireAdmin();
  const filters = parseAdminFilters(await searchParams);
  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select(
      "id,full_name,email,role,access_status,has_lifetime_access,level,xp,created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
  if (filters.search)
    query = query.or(
      `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`,
    );
  if (filters.status !== "all")
    query = query.eq("access_status", filters.status);
  if (filters.role !== "all") query = query.eq("role", filters.role);
  const from = (filters.page - 1) * ADMIN_PAGE_SIZE;
  const [rows, total, approved, pending, suspended] = await Promise.all([
    query.range(from, from + ADMIN_PAGE_SIZE - 1),
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
  ]);
  if (
    [rows, total, approved, pending, suspended].some((result) => result.error)
  )
    throw new Error("No se pudieron cargar los usuarios.");
  const matched = rows.count ?? 0;
  const pages = Math.max(1, Math.ceil(matched / ADMIN_PAGE_SIZE));
  if (filters.page > pages)
    redirect(adminPageHref("/admin/users", pages, filters));
  return (
    <div className="space-y-6">
      <header className="ainara-page-header">
        <p className="ainara-eyebrow">PERSONAS / ACCESOS</p>
        <h1>Cuida tu comunidad.</h1>
        <p>
          Gestiona cuentas, roles y accesos. Busca en todos los usuarios
          registrados.
        </p>
      </header>
      <form action="/admin/users" method="get" className="admin-toolbar">
        <div className="min-w-0 flex-1">
          <label htmlFor="admin-user-search">Nombre o email</label>
          <input
            id="admin-user-search"
            name="q"
            defaultValue={filters.search}
            maxLength={80}
            placeholder="Buscar usuarios…"
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="admin-user-status">Suscripción</label>
          <select
            id="admin-user-status"
            name="status"
            defaultValue={filters.status}
          >
            <option value="all">Todos los estados</option>
            <option value="approved">Activa</option>
            <option value="pending">Sin suscripción activa</option>
            <option value="suspended">Suspendida</option>
          </select>
        </div>
        <div>
          <label htmlFor="admin-user-role">Rol</label>
          <select id="admin-user-role" name="role" defaultValue={filters.role}>
            <option value="all">Todos los roles</option>
            <option value="student">Estudiantes</option>
            <option value="mentor">Mentores</option>
            <option value="admin">Administradores</option>
          </select>
        </div>
        <Button type="submit">Buscar</Button>
        {(filters.search ||
          filters.status !== "all" ||
          filters.role !== "all") && (
          <Button asChild variant="ghost">
            <Link href="/admin/users">Limpiar filtros</Link>
          </Button>
        )}
      </form>
      <UsersTable
        users={rows.data ?? []}
        counts={{
          total: total.count ?? 0,
          approved: approved.count ?? 0,
          pending: pending.count ?? 0,
          suspended: suspended.count ?? 0,
        }}
      />
      <nav aria-label="Paginación de usuarios" className="admin-pagination">
        <p className="text-sm text-muted-foreground">
          {matched
            ? `${from + 1}–${Math.min(from + ADMIN_PAGE_SIZE, matched)} de ${matched}`
            : "0 usuarios"}{" "}
          · Página {filters.page} de {pages}
        </p>
        <div className="flex gap-2">
          {filters.page > 1 && (
            <Button asChild variant="outline">
              <Link
                href={adminPageHref("/admin/users", filters.page - 1, filters)}
              >
                Anterior
              </Link>
            </Button>
          )}
          {filters.page < pages && (
            <Button asChild variant="outline">
              <Link
                href={adminPageHref("/admin/users", filters.page + 1, filters)}
              >
                Siguiente
              </Link>
            </Button>
          )}
        </div>
      </nav>
    </div>
  );
}
