import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
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
} from "lucide-react"

export const metadata: Metadata = {
  title: "Dashboard | Ainara",
  description: "Tu centro de control para el aprendizaje y transformacion",
}

async function getUserStats(userId: string) {
  const supabase = await createClient()
  
  // Get user profile with stats
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()
  
  // Get enrollments count
  const { count: enrollmentsCount } = await supabase
    .from("enrollments")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
  
  // Get completed formations
  const { count: completedCount } = await supabase
    .from("enrollments")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed")
  
  // Get completed lessons count
  const { count: lessonsCompleted } = await supabase
    .from("user_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_completed", true)
  
  return {
    formationsInProgress: (enrollmentsCount || 0) - (completedCount || 0),
    formationsCompleted: completedCount || 0,
    lessonsCompleted: lessonsCompleted || 0,
    totalXp: profile?.xp || 0,
    currentStreak: profile?.streak_days || 0,
    level: profile?.level || 1,
    nextLevelProgress: ((profile?.xp || 0) % 500) / 5, // 500 XP per level
  }
}

async function getFormationsInProgress(userId: string) {
  const supabase = await createClient()
  
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      *,
      formation:formations (
        id,
        title,
        slug,
        thumbnail_url,
        modules (
          id,
          lessons (id)
        )
      )
    `)
    .eq("user_id", userId)
    .neq("status", "completed")
    .order("updated_at", { ascending: false })
    .limit(3)
  
  if (!enrollments) return []
  
  // Get progress for each formation
  const formationsWithProgress = await Promise.all(
    enrollments.map(async (enrollment) => {
      const formation = enrollment.formation as any
      if (!formation) return null
      
      const totalLessons = formation.modules?.reduce(
        (acc: number, mod: any) => acc + (mod.lessons?.length || 0),
        0
      ) || 0
      
      // Get completed lessons for this formation
      const lessonIds = formation.modules?.flatMap(
        (mod: any) => mod.lessons?.map((l: any) => l.id) || []
      ) || []
      
      const { count: completedLessons } = await supabase
        .from("user_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .in("lesson_id", lessonIds.length > 0 ? lessonIds : ["none"])
        .eq("is_completed", true)
      
      const progress = totalLessons > 0 
        ? Math.round(((completedLessons || 0) / totalLessons) * 100)
        : 0
      
      return {
        id: formation.id,
        title: formation.title,
        slug: formation.slug,
        progress,
        lessonsCompleted: completedLessons || 0,
        totalLessons,
        thumbnailUrl: formation.thumbnail_url,
      }
    })
  )
  
  return formationsWithProgress.filter(Boolean)
}

async function getRecentActivity(userId: string) {
  const supabase = await createClient()
  
  const { data: progress } = await supabase
    .from("user_progress")
    .select(`
      *,
      lesson:lessons (
        id,
        title
      )
    `)
    .eq("user_id", userId)
    .eq("is_completed", true)
    .order("completed_at", { ascending: false })
    .limit(5)
  
  if (!progress) return []
  
  return progress.map((p) => ({
    type: "lesson_completed",
    title: `Completaste: ${(p.lesson as any)?.title || "Leccion"}`,
    xp: 50,
    time: formatTimeAgo(p.completed_at),
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
  
  if (diffMins < 60) return `Hace ${diffMins} minutos`
  if (diffHours < 24) return `Hace ${diffHours} horas`
  if (diffDays === 1) return "Ayer"
  return `Hace ${diffDays} dias`
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/login")
  }
  
  const [stats, formationsInProgress, recentActivity] = await Promise.all([
    getUserStats(user.id),
    getFormationsInProgress(user.id),
    getRecentActivity(user.id),
  ])
  
  const userName = user.user_metadata?.first_name || user.email?.split("@")[0] || "Viajero"

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light tracking-tight text-foreground">
          Bienvenido, <span className="font-medium">{userName}</span>
        </h1>
        <p className="text-muted-foreground">
          Continua tu viaje de transformacion personal.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Racha Actual</CardTitle>
            <Flame className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.currentStreak} dias</div>
            <p className="text-xs text-muted-foreground">
              Mantente constante
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">XP Total</CardTitle>
            <Star className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.totalXp.toLocaleString()}</div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Nivel {stats.level}</span>
                <span className="text-primary">{stats.nextLevelProgress}%</span>
              </div>
              <Progress value={stats.nextLevelProgress} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lecciones</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.lessonsCompleted}</div>
            <p className="text-xs text-muted-foreground">
              Completadas
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Formaciones</CardTitle>
            <Trophy className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stats.formationsCompleted}</div>
            <p className="text-xs text-muted-foreground">
              Completadas de {stats.formationsInProgress + stats.formationsCompleted}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Continue Learning */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium">Continuar Aprendiendo</h2>
            <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80">
              <Link href="/library">
                Ver todo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="space-y-4">
            {formationsInProgress.map((formation: any) => (
              <Card key={formation.id} className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="font-medium text-foreground">{formation.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formation.lessonsCompleted} de {formation.totalLessons} lecciones
                        </p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progreso</span>
                          <span className="font-medium text-primary">{formation.progress}%</span>
                        </div>
                        <Progress value={formation.progress} className="h-2" />
                      </div>
                    </div>
                    <Button asChild className="bg-primary hover:bg-primary/90">
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

          {formationsInProgress.length === 0 && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mt-4 font-medium text-foreground">No tienes formaciones en curso</h3>
                <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
                  Explora nuestra biblioteca y comienza tu primera formacion para transformar tu vida
                </p>
                <Button className="mt-6 bg-primary hover:bg-primary/90" asChild>
                  <Link href="/library">Explorar Biblioteca</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h2 className="text-xl font-medium">Actividad Reciente</h2>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 pb-4 last:pb-0 last:border-0 border-b border-border/50"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        {activity.type === "lesson_completed" ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <Flame className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-tight text-foreground">
                          {activity.title}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">
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
                    Aun no tienes actividad reciente. Comienza una leccion para ver tu progreso aqui.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Acciones Rapidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start border-border/50 hover:bg-primary/5 hover:border-primary/30" asChild>
                <Link href="/library">
                  <BookOpen className="mr-2 h-4 w-4 text-primary" />
                  Explorar Formaciones
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start border-border/50 hover:bg-primary/5 hover:border-primary/30" asChild>
                <Link href="/taberna">
                  <Star className="mr-2 h-4 w-4 text-primary" />
                  Nueva Reflexion
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start border-border/50 hover:bg-primary/5 hover:border-primary/30" asChild>
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
  )
}
