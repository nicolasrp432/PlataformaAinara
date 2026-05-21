import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, Flame, BookOpen, MessageCircle, Lock, Send } from "lucide-react"
import { getInitials } from "@/lib/utils"
import { getProfileComments } from "@/lib/services/messaging"
import { ProfileWall } from "./profile-wall"
import { startConversationAction } from "./actions"

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
    .select("id, full_name, avatar_url, role, level, xp, bio, profile_visibility, allow_direct_messages")
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

  // Comentarios del muro
  const wallComments = await getProfileComments(userId)

  const roleLabels: Record<string, string> = {
    admin: "Administrador",
    mentor: "Mentor",
    student: "Estudiante",
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6 px-4">
      {/* ── Header del perfil ─────────────────────────────────────────────── */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-md overflow-hidden">
        <CardContent className="pt-6 pb-5">
          <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
            <Avatar className="h-20 w-20 ring-4 ring-primary/20 shrink-0">
              <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.full_name} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold leading-tight">{profile.full_name}</h1>
                {profile.role && (
                  <Badge variant="secondary" className="text-xs">
                    {roleLabels[profile.role] ?? profile.role}
                  </Badge>
                )}
              </div>

              {profile.bio && (
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                  {profile.bio}
                </p>
              )}

              <div className="mt-3 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Star className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold text-foreground">
                    {(profile.xp ?? 0).toLocaleString()}
                  </span>
                  <span className="text-xs">XP</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Flame className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold text-foreground">Niv. {profile.level ?? 1}</span>
                </div>
              </div>
            </div>

            {/* CTAs */}
            {!isSelf && currentUser && (
              <div className="flex flex-col gap-2 shrink-0">
                {profile.allow_direct_messages !== false && (
                  <form action={startConversationAction.bind(null, userId)}>
                    <Button type="submit" size="sm" className="gap-2 w-full">
                      <Send className="h-3.5 w-3.5" />
                      Enviar mensaje
                    </Button>
                  </form>
                )}
                {profile.allow_direct_messages === false && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    <span>No acepta mensajes</span>
                  </div>
                )}
              </div>
            )}
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
            <div className="flex flex-wrap gap-2">
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
                <div key={r.id} className="rounded-lg border border-border/40 p-3">
                  <p className="text-sm text-foreground/90 line-clamp-3">{r.content}</p>
                  {lesson && (
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      En: {lesson.title}
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
