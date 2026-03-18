import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Compass, Trophy, Sword, Target, Map, Award, Star } from "lucide-react"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Aventura | Ainara",
  description: "Cumple tus misiones, gana experiencia y sube de nivel.",
}

export default async function QuestPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Obtenemos los stats reales del usuario
  const { data: profile } = await supabase
    .from("profiles")
    .select("level, xp, streak_days")
    .eq("id", user.id)
    .single()

  const level = profile?.level || 1
  const xp = profile?.xp || 0
  const xpForNextLevel = level * 500 // Fórmula simple: 500 XP = Nivel 2, 1000 XP = Nivel 3, etc.
  const progressPercent = Math.min(100, Math.round((xp / xpForNextLevel) * 100))

  // Determinamos el estado de las misiones (Quests) basados en datos reales
  // Para este MVP, calculamos localmente si el usuario cumplió ciertas misiones.
  
  // 1. Misión de Inicio de Sesión
  const questLoginCompleted = true // Ya está aquí

  // 2. Misión de Taberna (Comprobar si tiene una reflexión)
  const { count: reflexCount } = await supabase
    .from("reflections")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
  const questTabernaCompleted = (reflexCount || 0) > 0

  // 3. Misión de Primera Lección
  const { count: lessonsCount } = await supabase
    .from("user_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_completed", true)
  const questLessonCompleted = (lessonsCount || 0) > 0

  const quests = [
    {
      id: 1,
      title: "El Despertar",
      description: "Entra a la plataforma por primera vez y descubre tu destino.",
      xpReward: 50,
      icon: Compass,
      completed: questLoginCompleted,
      color: "text-blue-500",
      bgBase: "bg-blue-500/10",
      borderBase: "border-blue-500/20"
    },
    {
      id: 2,
      title: "La Primera Sangre",
      description: "Completa exitosamente tu primera lección en la Biblioteca.",
      xpReward: 150,
      icon: Sword,
      completed: questLessonCompleted,
      color: "text-rose-500",
      bgBase: "bg-rose-500/10",
      borderBase: "border-rose-500/20"
    },
    {
      id: 3,
      title: "Voz del Pueblo",
      description: "Publica tu primer pensamiento o duda en La Taberna.",
      xpReward: 100,
      icon: Target,
      completed: questTabernaCompleted,
      color: "text-amber-500",
      bgBase: "bg-amber-500/10",
      borderBase: "border-amber-500/20"
    }
  ]

  const completedCount = quests.filter(q => q.completed).length

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-16 relative animation-fade-in">
      {/* Header Gamificado */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 sm:p-10 rounded-3xl bg-card/60 backdrop-blur-xl border border-border/50 shadow-2xl relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-500/10 rounded-full blur-[80px] -z-10" />
        
        <div className="flex-1 space-y-4 text-center md:text-left">
          <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none px-3 py-1 text-xs tracking-widest uppercase mb-2">
            Diario de Misiones
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Tu Gran <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500">Aventura</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto md:mx-0">
            Forja tu leyenda. Completa misiones para ganar conocimiento, experiencia y subir de nivel en la jerarquía de la comunidad.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-background/80 shadow-inner border border-border/50 w-full md:w-64 shrink-0">
           <div className="relative">
             <Trophy className="w-16 h-16 text-primary drop-shadow-lg" />
             <div className="absolute -bottom-2 -right-2 bg-foreground text-background text-xs font-bold px-2 py-1 rounded-md border-2 border-background">
               NIVEL {level}
             </div>
           </div>
           
           <div className="w-full mt-6 space-y-2">
              <div className="flex justify-between text-xs font-bold text-muted-foreground">
                <span>{xp} XP</span>
                <span>{xpForNextLevel} XP</span>
              </div>
              <Progress value={progressPercent} className="h-3 bg-primary/20" />
           </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Izquierda: Mapa de Progreso */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Map className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-semibold">Misiones Activas</h2>
            <Badge variant="outline" className="ml-auto bg-card">
              {completedCount}/{quests.length} Completadas
            </Badge>
          </div>

          <div className="space-y-4 relative">
             {/* Línea conectora visual */}
             <div className="absolute left-7 top-8 bottom-8 w-0.5 bg-border/50 hidden sm:block -z-10" />

             {quests.map((quest) => (
                <Card key={quest.id} className={cn(
                  "relative border transition-all duration-300 shadow-sm",
                  quest.completed 
                    ? "bg-muted/30 border-border/40 opacity-70 hover:opacity-100" 
                    : "bg-card/80 backdrop-blur-md border-border hover:border-primary/50 hover:shadow-md"
                )}>
                  <CardContent className="p-4 sm:p-6 flex items-start gap-4 sm:gap-6">
                    {/* Icono Conector */}
                    <div className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center shrink-0 border-4 border-background shadow-sm z-10 transition-colors",
                      quest.completed ? "bg-emerald-500 text-white" : quest.bgBase + " " + quest.color
                    )}>
                      {quest.completed ? <Award className="w-6 h-6" /> : <quest.icon className="w-6 h-6" />}
                    </div>

                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <h3 className={cn(
                          "text-lg font-bold truncate",
                          quest.completed ? "text-muted-foreground line-through decoration-emerald-500/50" : "text-foreground"
                        )}>
                          {quest.title}
                        </h3>
                        <Badge className={cn(
                          "w-fit border-none font-bold",
                          quest.completed ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary"
                        )}>
                          +{quest.xpReward} XP
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {quest.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
             ))}
          </div>
        </div>

        {/* Derecha: Logros / Leaderboard placeholder */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-border/50 bg-card/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500/20" /> Logros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-dashed border-border/50 p-6 text-center bg-muted/20">
                <Trophy className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                <h4 className="font-semibold text-sm mb-1">Pasillo de la Fama</h4>
                <p className="text-xs text-muted-foreground">Sube de nivel para desbloquear insignias especiales y destacar en la comunidad.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
