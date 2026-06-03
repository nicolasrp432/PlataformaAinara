import { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getAuthUser, getUserProfile, getQuestData } from "@/lib/data-access"
import { ProfileForm } from "./profile-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Flame, Star, Compass, Sword, MessageSquare, Map, BookOpen,
  Zap, TrendingUp, Crown, Award, CalendarDays, Settings, CreditCard,
  ArrowRight, CheckCircle2, Activity, Clock, Inbox,
} from "lucide-react"
import { getSunSign } from "@/lib/utils/astrology"
import { cn, getInitials } from "@/lib/utils"
import { getUserMentorshipSessions } from "@/lib/services/mentorship"
import { getProfileActivity } from "@/lib/services/profile"
import { createClient } from "@/lib/supabase/server"
import { CertificateCard } from "@/components/certificates/certificate-card"
import { listConversations } from "@/lib/services/messaging"
import { NatalChartSection } from "@/components/profile/NatalChartSection"
import type { NatalChartRecord } from "@/types"

interface Conversation {
  conversationId: string
  otherUser: { id: string; full_name: string; avatar_url: string | null } | null
  lastMessage: { body: string; created_at: string; sender_id: string } | null
  unreadCount: number
  lastMessageAt: string | null
}

interface DbUserCertificate {
  id: string
  certificate_number: string
  issued_at: string
  formations: { title: string } | null
}

export const metadata: Metadata = {
  title: "Mi Perfil | Μήτρα",
  description: "Gestiona tu información personal y visualiza tu evolución.",
}

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Ahora"
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export default async function ProfilePage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const supabase = await createClient()

  const [profile, questData, mentorshipSessions, activity, { data: subscription }, { data: userCertificates }, conversations, { data: natalChart }] = await Promise.all([
    getUserProfile(user.id),
    getQuestData(user.id),
    getUserMentorshipSessions(user.id),
    getProfileActivity(user.id),
    supabase
      .from("subscriptions")
      .select("status, current_period_end, cancel_at_period_end, stripe_price_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("certificates")
      .select(`
        id, certificate_number, issued_at,
        formations ( title )
      `)
      .eq("user_id", user.id)
      .order("issued_at", { ascending: false }),
    listConversations(user.id),
    supabase
      .from("natal_charts")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
  ])

  const userData = {
    id: user.id,
    full_name: user.user_metadata?.full_name || profile?.full_name || "Usuario",
    email: user.email || "",
    avatarUrl: user.user_metadata?.avatar_url || profile?.avatar_url || "",
    role: profile?.role || "student",
    level: profile?.level || 1,
    xp: profile?.xp ?? 0,
    streak: profile?.streak_days || 0,
    birth_date: profile?.birth_date || null,
    birth_time: profile?.birth_time || null,
    birth_city: profile?.birth_city || null,
  }

  const astro = userData.birth_date ? getSunSign(userData.birth_date) : null
  const sunSign = astro?.sign || ""
  const signSymbol = astro?.symbol || ""

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
    { id: "legend",      title: "Leyenda",            icon: Crown,       unlocked: qLevel >= 10 },
  ]

  const unlockedAchievements = ALL_ACHIEVEMENTS.filter((a) => a.unlocked)

  const subscriptionStatus = subscription?.status ?? "inactive"
  const subscriptionLabel: Record<string, { label: string; className: string }> = {
    active: { label: "Activa", className: "bg-emerald-500/15 text-emerald-700 border-emerald-300/40" },
    trialing: { label: "En prueba", className: "bg-blue-500/15 text-blue-700 border-blue-300/40" },
    past_due: { label: "Pago pendiente", className: "bg-amber-500/15 text-amber-700 border-amber-300/40" },
    canceled: { label: "Cancelada", className: "bg-rose-500/15 text-rose-700 border-rose-300/40" },
    inactive: { label: "Sin suscripción", className: "bg-muted text-muted-foreground border-border/60" },
  }
  const subBadge = subscriptionLabel[subscriptionStatus] ?? subscriptionLabel.inactive

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10 relative">
      {/* Header */}
      <div className="flex flex-col gap-2 relative z-10">
        <h1 className="text-3xl font-light tracking-tight text-foreground sm:text-4xl">
          Mi <span className="font-semibold text-primary">Perfil</span>{" "}
          <span className="text-muted-foreground text-base font-light hidden sm:inline">en Μήτρα</span>
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-xl">
          Aquí radica tu esencia como pensador y creador dentro de nuestra
          comunidad. Explora tus logros y actualiza tu identidad.
        </p>
      </div>

      <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
        {/* Left Column: Avatar & Main Stats (unchanged) */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-lg shadow-black/5 overflow-hidden group">
            <div className="h-28 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent w-full relative transition-all duration-500 group-hover:from-primary/40" />
            <CardContent className="px-6 py-0 pb-6 relative z-10 text-center">
              <div className="flex justify-center -mt-14 mb-5">
                <Avatar className="h-28 w-28 border-[6px] border-background shadow-xl transition-transform duration-300 hover:scale-105">
                  <AvatarImage src={userData.avatarUrl} className="object-cover" />
                  <AvatarFallback className="text-3xl bg-primary/10 text-primary font-bold">
                    {userData.full_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="space-y-1.5 mb-6">
                <h2 className="text-xl font-bold text-foreground tracking-tight">
                  {userData.full_name}
                </h2>
                <p className="text-sm text-muted-foreground font-medium">
                  {userData.email}
                </p>
              </div>
              <div className="flex justify-center items-center gap-2 mb-2">
                <Badge variant="secondary" className="bg-primary/15 text-primary hover:bg-primary/25 border-none transition-colors px-3 py-1">
                  {userData.role === "admin" ? "Fundador" : "Aventurero"}
                </Badge>
                <Badge variant="outline" className="border-primary/20 text-foreground px-3 py-1 bg-background/50">
                  Nivel {userData.level}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-md shadow-black/5 bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-medium text-foreground tracking-tight">
                Evolución
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10 transition-colors hover:bg-primary/10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/15 rounded-lg text-primary shadow-inner">
                    <Flame className="w-5 h-5 fill-primary/20" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Racha</p>
                    <p className="text-xs text-muted-foreground">Constancia</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-xl text-foreground">{userData.streak}</span>
                  <span className="text-xs text-muted-foreground block -mt-1">Días</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10 transition-colors hover:bg-primary/10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/15 rounded-lg text-primary shadow-inner">
                    <Star className="w-5 h-5 fill-primary/20" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Experiencia</p>
                    <p className="text-xs text-muted-foreground">Conocimiento</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-xl text-foreground">{userData.xp}</span>
                  <span className="text-xs text-primary block -mt-1 font-medium">XP</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button asChild variant="outline" className="w-full justify-start gap-2 border-border/50">
            <Link href="/profile/settings">
              <Settings className="w-4 h-4" />
              Ajustes y seguridad
            </Link>
          </Button>
        </div>

        {/* Right Column: Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="info">
            <TabsList className="bg-muted/50 w-full justify-start p-1 rounded-xl h-auto flex flex-wrap">
              <TabsTrigger value="info" className="rounded-lg py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5">
                <Award className="w-4 h-4" /> Información
              </TabsTrigger>
              <TabsTrigger value="activity" className="rounded-lg py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5">
                <Activity className="w-4 h-4" /> Actividad
              </TabsTrigger>
              <TabsTrigger value="mentorship" className="rounded-lg py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5">
                <CalendarDays className="w-4 h-4" /> Mentorías
                {mentorshipSessions.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
                    {mentorshipSessions.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="subscription" className="rounded-lg py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5">
                <CreditCard className="w-4 h-4" /> Suscripción
              </TabsTrigger>
              <TabsTrigger value="messages" className="rounded-lg py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5">
                <MessageSquare className="w-4 h-4" /> Mensajes
                {conversations.filter((c: Conversation) => c.unreadCount > 0).length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-4 px-1.5 text-[10px] bg-primary text-primary-foreground font-bold">
                    {conversations.reduce((acc: number, curr: Conversation) => acc + curr.unreadCount, 0)}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* INFO TAB */}
            <TabsContent value="info" className="mt-6 space-y-6 outline-none">
              <NatalChartSection
                chart={(natalChart as NatalChartRecord | null) ?? null}
                birthCity={userData.birth_city}
                birthTime={userData.birth_time}
                fallbackSign={sunSign}
                fallbackSymbol={signSymbol}
                userName={userData.full_name}
                editable
              />

              <ProfileForm
                initialData={{
                  id: userData.id,
                  full_name: userData.full_name,
                  avatar_url: userData.avatarUrl,
                  birth_date: userData.birth_date,
                  birth_time: userData.birth_time,
                  birth_city: userData.birth_city,
                }}
              />

              {unlockedAchievements.length > 0 && (
                <Card className="border-border/50 shadow-md shadow-black/5 bg-card/60 backdrop-blur-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg font-medium">
                      <Award className="w-5 h-5 text-primary" /> Insignias
                      <Badge variant="outline" className="ml-auto text-xs font-normal border-primary/20 text-primary">
                        {unlockedAchievements.length}/{ALL_ACHIEVEMENTS.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
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
                          title={`Bloqueado: ${ach.title}`}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/30 bg-muted/20 text-xs font-medium text-muted-foreground/40 opacity-40"
                        >
                          <span className="w-3.5 h-3.5 flex items-center justify-center">🔒</span>
                          ???
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {userCertificates && userCertificates.length > 0 && (
                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-medium text-foreground flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" /> Tus Certificados
                  </h3>
                  <div className="grid gap-6 sm:grid-cols-2">
                    {(userCertificates as unknown as DbUserCertificate[]).map((cert) => (
                      <CertificateCard
                        key={cert.id}
                        userName={userData.full_name}
                        formationTitle={cert.formations?.title || "Formación"}
                        issuedAt={cert.issued_at}
                        certificateNumber={cert.certificate_number}
                      />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ACTIVITY TAB */}
            <TabsContent value="activity" className="mt-6 space-y-6 outline-none">
              <Card className="border-border/50 bg-card/60 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" /> Últimas lecciones completadas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activity.recentLessons.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Aún no has completado lecciones. ¡Empieza tu primer módulo!
                    </p>
                  ) : (
                    activity.recentLessons.map((l) => (
                      <Link
                        key={l.id}
                        href={`/learn/${l.formation_slug}/${l.id}`}
                        className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate group-hover:text-primary">
                              {l.title}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {l.formation_title}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/60 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" /> Tus reflexiones recientes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activity.recentReflections.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      Aún no has publicado reflexiones.
                    </p>
                  ) : (
                    activity.recentReflections.map((r) => (
                      <div key={r.id} className="p-3 rounded-lg border border-border/30 bg-background/40">
                        <p className="text-sm text-foreground line-clamp-2">{r.content}</p>
                        {r.lesson_title && (
                          <p className="text-xs text-muted-foreground mt-2">
                            En: <span className="text-foreground">{r.lesson_title}</span>
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* MENTORSHIP TAB */}
            <TabsContent value="mentorship" className="mt-6 space-y-4 outline-none">
              {mentorshipSessions.length === 0 ? (
                <Card className="border-dashed border-2 border-border/50 bg-card/30 p-10 text-center">
                  <CalendarDays className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-foreground font-medium mb-2">No tienes mentorías reservadas</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Reserva una sesión 1:1 para acelerar tu transformación.
                  </p>
                  <Button asChild>
                    <Link href="/mentorship">
                      Explorar mentoría <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </Card>
              ) : (
                mentorshipSessions.map((s) => {
                  const date = new Date(s.scheduled_at)
                  const isPast = date.getTime() < Date.now()
                  const statusColors: Record<string, string> = {
                    confirmed: "bg-emerald-500/15 text-emerald-700 border-emerald-300/40",
                    pending: "bg-amber-500/15 text-amber-700 border-amber-300/40",
                    completed: "bg-blue-500/15 text-blue-700 border-blue-300/40",
                    cancelled: "bg-rose-500/15 text-rose-700 border-rose-300/40",
                    no_show: "bg-muted text-muted-foreground border-border/60",
                  }
                  const statusLabels: Record<string, string> = {
                    confirmed: "Confirmada",
                    pending: "Pago pendiente",
                    completed: "Completada",
                    cancelled: "Cancelada",
                    no_show: "No asistida",
                  }
                  return (
                    <Card key={s.id} className="border-border/50 bg-card/60 backdrop-blur-md">
                      <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <CalendarDays className="w-4 h-4 text-primary" />
                            <p className="text-sm font-semibold text-foreground">
                              {date.toLocaleString("es-ES", { dateStyle: "full", timeStyle: "short" })}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {s.duration_minutes} min
                            </span>
                            <Badge variant="outline" className={cn("border", statusColors[s.status] ?? statusColors.pending)}>
                              {statusLabels[s.status] ?? s.status}
                            </Badge>
                          </div>
                          {s.user_notes && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                              Notas: {s.user_notes}
                            </p>
                          )}
                        </div>
                        {s.status === "confirmed" && s.meeting_link && !isPast && (
                          <Button asChild size="sm">
                            <a href={s.meeting_link} target="_blank" rel="noreferrer">
                              Entrar a la sala <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </a>
                          </Button>
                        )}
                        {s.status === "confirmed" && !s.meeting_link && (
                          <span className="text-xs text-muted-foreground italic">
                            La sala se enviará 24h antes
                          </span>
                        )}
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </TabsContent>

            {/* SUBSCRIPTION TAB */}
            <TabsContent value="subscription" className="mt-6 space-y-4 outline-none">
              <Card className="border-border/50 bg-card/60 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" /> Tu suscripción
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Estado</span>
                    <Badge className={cn("border", subBadge.className)}>{subBadge.label}</Badge>
                  </div>
                  {subscription?.current_period_end && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {subscription.cancel_at_period_end ? "Cancela el" : "Próxima renovación"}
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {new Date(subscription.current_period_end).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    </div>
                  )}
                  <Button asChild className="w-full">
                    <Link href="/billing">
                      Gestionar suscripción <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* MESSAGES TAB */}
            <TabsContent value="messages" className="mt-6 space-y-4 outline-none">
              <Card className="border-border/50 bg-card/60 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" /> Tus conversaciones
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {conversations.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                      <Inbox className="h-10 w-10 opacity-30" />
                      <p className="text-sm font-medium">No tienes conversaciones todavía.</p>
                      <p className="text-xs opacity-70">
                        Visita el perfil público de otro usuario para iniciar un chat.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {conversations.map((conv: Conversation) => (
                        <Link
                          key={conv.conversationId}
                          href={`/messages/${conv.conversationId}`}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50"
                        >
                          <Avatar className="h-10 w-10 shrink-0 ring-1 ring-primary/10">
                            <AvatarImage src={conv.otherUser?.avatar_url ?? undefined} />
                            <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                              {getInitials(conv.otherUser?.full_name ?? "?")}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-sm font-semibold truncate text-foreground hover:text-primary transition-colors">
                                {conv.otherUser?.full_name ?? "Usuario"}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {conv.unreadCount > 0 && (
                                  <Badge className="h-5 min-w-5 px-1 text-[10px] font-bold rounded-full bg-primary text-primary-foreground">
                                    {conv.unreadCount}
                                  </Badge>
                                )}
                                {conv.lastMessageAt && (
                                  <span className="text-[10px] text-muted-foreground">
                                    {formatRelative(conv.lastMessageAt)}
                                  </span>
                                )}
                              </div>
                            </div>
                            {conv.lastMessage && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {conv.lastMessage.sender_id === userData.id ? "Tú: " : ""}
                                {conv.lastMessage.body}
                              </p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
