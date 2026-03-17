import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

// Mock stats - will be fetched from API
const mockStats = {
  totalUsers: 1234,
  activeUsers: 856,
  newUsersThisMonth: 124,
  totalFormations: 8,
  publishedFormations: 6,
  totalLessons: 156,
  completedLessons: 4523,
  averageProgress: 42,
}

const recentUsers = [
  { id: "1", name: "Maria Garcia", email: "maria@example.com", joinedAt: "Hace 2 horas" },
  { id: "2", name: "Carlos Lopez", email: "carlos@example.com", joinedAt: "Hace 5 horas" },
  { id: "3", name: "Ana Martinez", email: "ana@example.com", joinedAt: "Ayer" },
]

const recentActivity = [
  { type: "formation", action: "publicada", title: "Meditacion Avanzada", time: "Hace 1 hora" },
  { type: "lesson", action: "creada", title: "Respiracion Consciente", time: "Hace 3 horas" },
  { type: "user", action: "registrado", title: "Carlos Lopez", time: "Hace 5 horas" },
]

export default function AdminDashboardPage() {
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
            <div className="text-2xl font-bold">{mockStats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success">+{mockStats.newUsersThisMonth}</span> este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((mockStats.activeUsers / mockStats.totalUsers) * 100)}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Formaciones</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalFormations}</div>
            <p className="text-xs text-muted-foreground">
              {mockStats.publishedFormations} publicadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lecciones</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalLessons}</div>
            <p className="text-xs text-muted-foreground">
              {mockStats.completedLessons.toLocaleString()} completadas
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
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      {user.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {user.joinedAt}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Actividad Reciente</CardTitle>
                <CardDescription>
                  Ultimas acciones en la plataforma
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      {activity.type === "formation" && <BookOpen className="h-4 w-4" />}
                      {activity.type === "lesson" && <Video className="h-4 w-4" />}
                      {activity.type === "user" && <Users className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className="font-medium">{activity.title}</span>
                        <span className="text-muted-foreground"> {activity.action}</span>
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activity.time}
                  </Badge>
                </div>
              ))}
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
