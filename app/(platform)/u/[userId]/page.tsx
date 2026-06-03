import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Star, Flame, BookOpen, MessageCircle, Lock, Send,
  Compass, Sword, MessageSquare, Map, Zap, TrendingUp, Crown, Award
} from "lucide-react"
import { getInitials, cn } from "@/lib/utils"
import { getProfileComments } from "@/lib/services/messaging"
import { ProfileWall } from "./profile-wall"
import { startConversationAction } from "./actions"
import { getQuestData } from "@/lib/data-access"
import { getSunSign } from "@/lib/utils/astrology"
import { NatalChartSection } from "@/components/profile/NatalChartSection"
import type { NatalChartRecord } from "@/types"

interface PageProps {
  params: Promise<{ userId: string }>
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { userId } = await params
  const supabase = await createClient()

  const { data: { user: currentUser } } = await supabase.auth.getUser()

  // Fetch del perfil objetivo
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role, level, xp, bio, profile_visibility, allow_direct_messages, birth_date, birth_time, birth_city")
    .eq("id", userId)
    .single()

  if (!profile) notFound()

  const isSelf = currentUser?.id === userId
  const visibility = profile.profile_visibility ?? "community"

  // Respeta visibilidad
  if (visibility === "private" && !isSelf) notFound()
  if (visibility === "community" && !currentUser) redirect("/login")

  // Formaciones con al menos una lección completada (deduplicadas por formation_id)
  const { data: progressRows } = await supabase
    .from("user_progress")
    .select("formation_id, formations(id, title, slug)")
    .eq("user_id", userId)
    .eq("is_completed", true)
    .limit(30)

  // Deduplicar por formation_id
  const seenIds = new Set<string>()
  const completedFormations = (progressRows ?? []).filter((row) => {
    const fid = row.formation_id as string
    if (!fid || seenIds.has(fid)) return false
    seenIds.add(fid)
    return true
  }).slice(0, 6)

  // Reflections públicas recientes
  const { data: reflections } = await supabase
    .from("reflections")
    .select("id, content, created_at, lessons(title)")
    .eq("user_id", userId)
    .eq("is_public", true)
    .is("parent_id", null)
    .order("created_at", { ascending: false })
    .limit(5)

  // Comentarios del muro, logros (Quest) y carta natal
  const [wallComments, questData, { data: natalChart }] = await Promise.all([
    getProfileComments(userId),
    getQuestData(userId),
    supabase
      .from("natal_charts")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
  ])

  const astro = profile.birth_date ? getSunSign(profile.birth_date) : null
  const sunSign = astro?.sign || ""
  const signSymbol = astro?.symbol || ""

  const roleLabels: Record<string, string> = {
    admin: "Administrador",
    mentor: "Mentor",
    student: "Estudiante",
  }

  const { lessonsCount, reflectionsCount, enrollmentsCount, streakDays: qStreak, xp: qXp, level: qLevel } = questData

  const ALL_ACHIEVEMENTS = [
    { id: "awakening",   title: "El Despertar",       icon: Compass,     unlocked: true },
    { id: "first_lesson",title: "Primera Sangre",     icon: Sword,       unlocked: lessonsCount >= 1 },
    { id: "first_voice", title: "Voz del Pueblo",     icon: MessageSquare, unlocked: reflectionsCount >= 1 },
    { id: "explorer",    title: "Explorador",          icon: Map,         unlocked: enrollmentsCount >= 2 },
    { id: "apprentice",  title: "Aprendiz Dedicado",  icon: BookOpen,    unlocked: lessonsCount >= 5 },
    { id: "fire_streak", title: "Llama Interna",      icon: Flame,       unlocked: qStreak >= 7 },
    { id: "collector",   title: "Coleccionista",      icon: Star,        unlocked: qXp >= 1000 },
    { id: "warrior",     title: "Guerrero del Saber", icon: Zap,         unlocked: lessonsCount >= 10 },
    { id: "level5",      title: "Ascensión",          icon: TrendingUp,  unlocked: qLevel >= 5 },
    { id: "legend",      title: "Leyenda de la Matriz", icon: Crown,     unlocked: qLevel >= 10 },
  ]

  const unlockedAchievements = ALL_ACHIEVEMENTS.filter((a) => a.unlocked)

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6 px-4">
      {/* ── Header del perfil ─────────────────────────────────────────────── */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-md overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-[80px] pointer-events-none" />
        <CardContent className="pt-8 pb-7 px-6">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
            <Avatar className="h-24 w-24 border-[4px] border-background ring-4 ring-primary/20 shrink-0 transition-transform duration-300 hover:scale-105 shadow-xl">
              <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.full_name ?? undefined} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 flex-wrap justify-center sm:justify-start">
                <h1 className="text-2xl font-bold leading-none text-foreground tracking-tight">{profile.full_name}</h1>
                {profile.role && (
                  <Badge variant="secondary" className="bg-primary/15 text-primary hover:bg-primary/25 border-none transition-colors px-2.5 py-0.5 text-xs">
                    {roleLabels[profile.role] ?? profile.role}
                  </Badge>
                )}
              </div>

              {profile.bio && (
                <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto sm:mx-0">
                  {profile.bio}
                </p>
              )}

              <div className="flex justify-center sm:justify-start items-center gap-5 text-sm pt-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Star className="h-4 w-4 text-primary fill-primary/20" />
                  <span className="font-bold text-foreground">
                    {(profile.xp ?? 0).toLocaleString()}
                  </span>
                  <span className="text-xs">XP</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Flame className="h-4 w-4 text-primary fill-primary/20" />
                  <span className="font-bold text-foreground">Nivel {profile.level ?? 1}</span>
                </div>
              </div>
            </div>

            {/* CTAs */}
            {!isSelf && currentUser && (
              <div className="w-full sm:w-auto mt-4 sm:mt-0 flex flex-col gap-2 shrink-0">
                {profile.allow_direct_messages !== false && (
                  <form action={startConversationAction.bind(null, userId)} className="w-full">
                    <Button type="submit" size="sm" className="gap-2 w-full h-11 sm:h-9 text-sm shadow-md">
                      <Send className="h-3.5 w-3.5" />
                      Enviar mensaje
                    </Button>
                  </form>
                )}
                {profile.allow_direct_messages === false && (
                  <Badge variant="outline" className="flex items-center gap-1.5 text-xs text-muted-foreground border-border bg-muted/20 py-2 justify-center">
                    <Lock className="h-3.5 w-3.5" />
                    <span>No acepta mensajes</span>
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Diseño Cósmico (Carta Natal) ────────────────────────────────── */}
      {(natalChart || (profile.birth_date && sunSign)) && (
        <NatalChartSection
          chart={(natalChart as NatalChartRecord | null) ?? null}
          birthCity={profile.birth_city}
          birthTime={profile.birth_time}
          fallbackSign={sunSign}
          fallbackSymbol={signSymbol}
        />
      )}

      {/* ── Logros / Insignias del usuario ───────────────────────────────── */}
      <Card className="border-border/50 shadow-md shadow-black/5 bg-card/60 backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Award className="w-4 h-4 text-primary" /> Insignias y Logros
            <Badge variant="outline" className="ml-auto text-xs font-normal border-primary/20 text-primary bg-primary/5">
              {unlockedAchievements.length}/{ALL_ACHIEVEMENTS.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {unlockedAchievements.map((ach) => {
              const Icon = ach.icon
              return (
                <div
                  key={ach.id}
                  title={ach.title}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full border bg-primary/5 border-primary/20",
                    "text-xs font-medium text-foreground transition-all hover:bg-primary/10"
                  )}
                >
                  <Icon className="w-3.5 h-3.5 text-primary" />
                  {ach.title}
                </div>
              )
            })}
            {ALL_ACHIEVEMENTS.filter((a) => !a.unlocked).map((ach) => (
              <div
                key={ach.id}
                title={`Bloqueado`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/30 bg-muted/20 text-xs font-medium text-muted-foreground/40 opacity-40 animate-pulse"
              >
                <span className="w-3.5 h-3.5 flex items-center justify-center">🔒</span>
                ???
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Formaciones completadas ────────────────────────────────────────── */}
      {completedFormations && completedFormations.length > 0 && (
        <Card className="border-border/50 bg-card/60 backdrop-blur-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Formaciones completadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              {completedFormations.map((row) => {
                const rawF = row.formations
                const f = (Array.isArray(rawF) ? rawF[0] : rawF) as
                  | { id: string; title: string; slug: string }
                  | null
                if (!f) return null
                return (
                  <Badge key={row.formation_id as string} variant="outline" className="text-xs">
                    {f.title}
                  </Badge>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Reflexiones recientes ──────────────────────────────────────────── */}
      {reflections && reflections.length > 0 && (
        <Card className="border-border/50 bg-card/60 backdrop-blur-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              Reflexiones recientes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reflections.map((r) => {
              const rawLesson = r.lessons
              const lesson = (Array.isArray(rawLesson) ? rawLesson[0] : rawLesson) as
                | { title: string }
                | null
              return (
                <div key={r.id} className="rounded-lg border border-border/40 p-3 bg-background/30">
                  <p className="text-sm text-foreground/90 line-clamp-3 leading-relaxed">{r.content}</p>
                  {lesson && (
                    <p className="mt-1.5 text-[11px] text-muted-foreground flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> En: {lesson.title}
                    </p>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* ── Muro del perfil ───────────────────────────────────────────────── */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-md">
        <CardContent className="pt-5 pb-5">
          <ProfileWall
            profileId={userId}
            initialComments={wallComments.map((c) => {
              const rawP = (c as Record<string, unknown>).profiles
              const profiles = (Array.isArray(rawP) ? rawP[0] : rawP) as
                | { id: string; full_name: string; avatar_url: string | null }
                | null
              return {
                id: c.id as string,
                content: c.content as string,
                created_at: c.created_at as string,
                author_id: (c as Record<string, unknown>).author_id as string,
                profiles,
              }
            })}
            currentUserId={currentUser?.id ?? null}
          />
        </CardContent>
      </Card>
    </div>
  )
}
