import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"
import {
  Users,
  BookOpen,
  Video,
  TrendingUp,
  ArrowRight,
  Plus,
  Eye,
  Clock,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Panel de Administracion",
  description: "Dashboard de administracion de la plataforma Ainara",
}

async function getAdminStats() {
  const supabase = await createClient()

  // Get total users
  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })

  // Get total formations
  const { count: totalFormations } = await supabase
    .from("formations")
    .select("*", { count: "exact", head: true })

  // Get published formations
  const { count: publishedFormations } = await supabase
    .from("formations")
    .select("*", { count: "exact", head: true })
    .eq("is_published", true)

  // Get total lessons
  const { count: totalLessons } = await supabase
    .from("lessons")
    .select("*", { count: "exact", head: true })

  // Get completed lessons
  const { count: completedLessons } = await supabase
    .from("user_progress")
    .select("*", { count: "exact", head: true })
    .eq("is_completed", true)

  // Get total enrollments
  const { count: totalEnrollments } = await supabase
    .from("enrollments")
    .select("*", { count: "exact", head: true })

  return {
    totalUsers: totalUsers ?? 0,
    totalFormations: totalFormations ?? 0,
    publishedFormations: publishedFormations ?? 0,
    totalLessons: totalLessons ?? 0,
    completedLessons: completedLessons ?? 0,
    totalEnrollments: totalEnrollments ?? 0,
  }
}

async function getRecentUsers() {
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, created_at, role")
    .order("created_at", { ascending: false })
    .limit(5)

  if (!profiles) return []

  return profiles.map((profile) => ({
    id: profile.id,
    name: profile.full_name || "Sin nombre",
    role: profile.role || "student",
    joinedAt: formatTimeAgo(profile.created_at),
  }))
}

async function getRecentFormations() {
  const supabase = await createClient()

  const { data: formations } = await supabase
    .from("formations")
    .select("id, title, is_published, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(5)

  if (!formations) return []

  return formations.map((formation) => ({
    id: formation.id,
    title: formation.title,
    isPublished: formation.is_published,
    time: formatTimeAgo(formation.updated_at || formation.created_at),
  }))
}

function formatTimeAgo(date: string | null): string {
  if (!date) return "Reciente"
  const now = new Date()
  const past = new Date(date)
  const diffMs = now.getTime() - past.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "Ahora"
  if (diffMins < 60) return `Hace ${diffMins}m`
  if (diffHours < 24) return `Hace ${diffHours}h`
  if (diffDays === 1) return "Ayer"
  if (diffDays < 30) return `Hace ${diffDays} dias`
  return `Hace ${Math.floor(diffDays / 30)} meses`
}

export default async function AdminDashboardPage() {
  const [stats, recentUsers, recentFormations] = await Promise.all([
    getAdminStats(),
    getRecentUsers(),
    getRecentFormations(),
  ])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel de Administracion</h1>
          <p className="text-muted-foreground">
            Gestiona el contenido y usuarios de la plataforma
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/admin/content/formations">
              <Eye className="mr-2 h-4 w-4" />
              Ver Contenido
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/content/formations/new">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Formacion
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Totales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Usuarios registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inscripciones</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEnrollments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Inscripciones totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Formaciones</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFormations}</div>
            <p className="text-xs text-muted-foreground">
              {stats.publishedFormations} publicadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lecciones</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLessons}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedLessons.toLocaleString()} completadas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Usuarios Recientes</CardTitle>
                <CardDescription>
                  Ultimos usuarios registrados en la plataforma
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/users">
                  Ver todos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {user.joinedAt}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay usuarios registrados aun
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Formations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Formaciones Recientes</CardTitle>
                <CardDescription>
                  Ultimas formaciones creadas o actualizadas
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentFormations.length > 0 ? (
                recentFormations.map((formation) => (
                  <div key={formation.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{formation.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={formation.isPublished ? "default" : "secondary"} className="text-xs">
                        {formation.isPublished ? "Publicada" : "Borrador"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formation.time}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay formaciones creadas aun
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rapidas</CardTitle>
          <CardDescription>
            Accesos directos a las tareas mas comunes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto flex-col gap-2 p-4" asChild>
              <Link href="/admin/content/formations/new">
                <BookOpen className="h-6 w-6" />
                <span>Nueva Formacion</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 p-4" asChild>
              <Link href="/admin/content/lessons/new">
                <Video className="h-6 w-6" />
                <span>Nueva Leccion</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 p-4" asChild>
              <Link href="/admin/users">
                <Users className="h-6 w-6" />
                <span>Gestionar Usuarios</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 p-4" asChild>
              <Link href="/admin/analytics">
                <TrendingUp className="h-6 w-6" />
                <span>Ver Analiticas</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
