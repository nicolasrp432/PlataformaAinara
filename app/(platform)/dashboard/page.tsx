import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
} from "lucide-react"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Tu centro de control para el aprendizaje y transformacion",
}

// Mock data - will be replaced with real data from API
const mockStats = {
  formationsInProgress: 2,
  formationsCompleted: 1,
  lessonsCompleted: 23,
  totalXp: 1250,
  currentStreak: 5,
  level: 3,
  nextLevelProgress: 65,
}

const mockFormationsInProgress = [
  {
    id: "1",
    title: "Fundamentos del Autoconocimiento",
    slug: "fundamentos-autoconocimiento",
    progress: 45,
    lessonsCompleted: 9,
    totalLessons: 20,
    lastLesson: "El poder de la observacion",
  },
  {
    id: "2",
    title: "Meditacion y Mindfulness",
    slug: "meditacion-mindfulness",
    progress: 20,
    lessonsCompleted: 4,
    totalLessons: 20,
    lastLesson: "Respiracion consciente",
  },
]

const mockRecentActivity = [
  {
    type: "lesson_completed",
    title: "Completaste: El poder de la observacion",
    xp: 50,
    time: "Hace 2 horas",
  },
  {
    type: "streak",
    title: "Racha de 5 dias!",
    xp: 25,
    time: "Hoy",
  },
  {
    type: "lesson_completed",
    title: "Completaste: Respiracion consciente",
    xp: 50,
    time: "Ayer",
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido de nuevo. Continua tu viaje de transformacion.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Racha Actual</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.currentStreak} dias</div>
            <p className="text-xs text-muted-foreground">
              Mejor racha: 12 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">XP Total</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalXp}</div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Nivel {mockStats.level}</span>
                <span>{mockStats.nextLevelProgress}%</span>
              </div>
              <Progress value={mockStats.nextLevelProgress} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lecciones</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.lessonsCompleted}</div>
            <p className="text-xs text-muted-foreground">
              Completadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Formaciones</CardTitle>
            <Trophy className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.formationsCompleted}</div>
            <p className="text-xs text-muted-foreground">
              Completadas de {mockStats.formationsInProgress + mockStats.formationsCompleted}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Continue Learning */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Continuar Aprendiendo</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/library">
                Ver todo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="space-y-4">
            {mockFormationsInProgress.map((formation) => (
              <Card key={formation.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="font-semibold">{formation.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Ultima leccion: {formation.lastLesson}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {formation.lessonsCompleted} de {formation.totalLessons} lecciones
                          </span>
                          <span className="font-medium">{formation.progress}%</span>
                        </div>
                        <Progress value={formation.progress} className="h-2" />
                      </div>
                    </div>
                    <Button asChild>
                      <Link href={`/library/${formation.slug}`}>
                        <Play className="mr-2 h-4 w-4" />
                        Continuar
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {mockFormationsInProgress.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 font-semibold">No tienes formaciones en curso</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Explora nuestra biblioteca y comienza tu primera formacion
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/library">Explorar Biblioteca</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Actividad Reciente</h2>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                {mockRecentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 pb-4 last:pb-0 last:border-0 border-b"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      {activity.type === "lesson_completed" ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : (
                        <Flame className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-tight">
                        {activity.title}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
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
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acciones Rapidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/library">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Explorar Formaciones
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/taberna">
                  <Star className="mr-2 h-4 w-4" />
                  Nueva Reflexion
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/mentorship">
                  <Clock className="mr-2 h-4 w-4" />
                  Agendar Mentoria
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
