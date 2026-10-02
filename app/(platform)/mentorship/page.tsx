import { Metadata } from "next"
import { requireContentAccess } from "@/lib/guards"
import Link from "next/link"
import { getUserMentorshipSessions } from "@/lib/services/mentorship"
import { PageHeader } from "@/components/layout/page-header"
import { MentorshipWorkspace, type MentorshipWorkspaceData } from "@/components/mentorship/mentorship-workspace"
import { getAccessTier } from "@/lib/data-access"
import { hasIncludedMentoring } from "@/lib/access"
import { createClient } from "@/lib/supabase/server"
import { Card } from "@/components/ui/card"
import { Clock, Sparkles, ShieldCheck, Heart } from "lucide-react"
import { MentorHero } from "@/components/mentorship/mentor-hero"
import { ChatPanel } from "@/components/ai/chat-panel"
import { MENTOR_PROFILE } from "@/lib/mentor"

export const metadata: Metadata = {
  title: "Mentoría",
  description:
    "Sesiones 1 a 1 con Ainara para avanzar en lo que te importa, con un plan que cabe en tu vida.",
}

const DEFAULT_SESSION_PRICE = 150
const DEFAULT_SESSION_MINUTES = 60

export default async function MentorshipPage() {
  // Haber comprado basta para reservar. Lo que decide la suscripción no es el
  // acceso a esta página, sino si la sesión se paga aparte.
  const user = await requireContentAccess("/mentorship")
  const tier = await getAccessTier(user.id)
  const includedInMembership = hasIncludedMentoring(tier)

  // De la base de datos solo se toma lo operativo: el id con el que se crea la
  // reserva, el precio y la duración. El perfil público (nombre, retrato,
  // experiencia, biografía) vive en `lib/mentor.ts` — ver el comentario de ese
  // fichero para el porqué.
  const supabase = await createClient()
  const { data: dbMentors } = await supabase
    .from("mentors")
    .select("id, session_price, session_duration_minutes")
    .eq("is_active", true)
    .limit(1)

  const dbMentor = dbMentors?.[0] ?? null

  const mentor = {
    id: dbMentor?.id ?? "default-mentor",
    name: MENTOR_PROFILE.name,
    full_name: MENTOR_PROFILE.name,
    session_price: dbMentor?.session_price ?? DEFAULT_SESSION_PRICE,
    session_duration_minutes:
      dbMentor?.session_duration_minutes ?? DEFAULT_SESSION_MINUTES,
  }

  const [sessions,workspace,requests] = await Promise.all([
    getUserMentorshipSessions(user.id),
    tier === "staff" ? supabase.rpc("mentorship_workspace") : Promise.resolve({ data: null,error: null }),
    supabase.from("mentorship_requests").select("id,notes,status,created_at").eq("user_id",user.id).order("created_at",{ ascending: false }).limit(5),
  ])
  const upcoming = sessions.filter(session => new Date(session.scheduled_at).getTime() > Date.now() && (session.status === "confirmed" || (session.status === "pending" && session.hold_expires_at && new Date(session.hold_expires_at).getTime() > Date.now())))

  return (
    <div className="relative mx-auto max-w-5xl space-y-12 pb-16 animation-fade-in">
      <PageHeader eyebrow="Acompañamiento personal" title={<>Mentoría <em>1 a 1.</em></>} description={MENTOR_PROFILE.tagline} />
      {tier === "staff" && (workspace.error ? <p role="alert" className="text-sm text-danger-strong">No se pudo cargar la agenda del equipo. Vuelve a intentarlo.</p> : workspace.data && <MentorshipWorkspace data={workspace.data as MentorshipWorkspaceData} />)}
      {upcoming.length > 0 && <section className="space-y-3"><h2 className="text-2xl">Tus próximos encuentros</h2><div className="grid gap-3 sm:grid-cols-2">{upcoming.map(session => <article key={session.id} className="space-y-3 rounded-2xl border border-primary/20 bg-card p-5"><p className="font-semibold">{new Date(session.scheduled_at).toLocaleString("es-ES",{ timeZone: session.timezone,dateStyle: "medium",timeStyle: "short" })}</p><p className="text-sm text-muted-foreground">{session.timezone} · {session.duration_minutes} min · {session.status === "confirmed" ? "Confirmada" : "Pendiente de pago"}</p>{session.status === "confirmed" && session.meeting_link?.startsWith("https://") ? <a className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" href={session.meeting_link} target="_blank" rel="noopener noreferrer">Abrir videollamada</a> : <p className="text-xs text-muted-foreground">{session.status === "confirmed" ? "El equipo añadirá aquí el enlace del encuentro." : "La reserva se confirma al completar el pago."}</p>}</article>)}</div><Link href="/profile?tab=mentorship" className="text-sm text-primary underline">Ver el historial de sesiones</Link></section>}
      {!!requests.data?.length && <section className="space-y-3"><h2 className="text-xl">Tus solicitudes</h2>{requests.data.map(request => <div key={request.id} className="rounded-xl border border-border bg-card p-4"><p className="break-words text-sm">{request.notes}</p><p className="mt-2 text-xs text-muted-foreground">{({ pending: "Pendiente de revisión",contacted: "En coordinación",closed: "Cerrada" } as Record<string,string>)[request.status]}</p></div>)}</section>}

      <MentorHero mentor={mentor} includedInMembership={includedInMembership} />

      {/* Cómo trabaja: el «qué pasa si reservo», que es la duda real. */}
      <section className="space-y-4">
        <h2 className="label-luxury">Cómo trabajamos</h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {MENTOR_PROFILE.approach.map((step, i) => (
            <li
              key={step.title}
              className="relative min-w-0 rounded-2xl border border-border/50 bg-card/40 p-5"
            >
              <span
                aria-hidden
                className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary"
              >
                {i + 1}
              </span>
              <p className="text-sm font-semibold text-foreground">{step.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Señales de confianza */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: ShieldCheck, title: "Pago seguro", desc: "Procesado por Stripe" },
          { icon: Heart, title: "Confidencial", desc: "Espacio íntimo y privado" },
          { icon: Clock, title: "Flexible", desc: "Elige entre los horarios disponibles" },
        ].map((item) => (
          <div
            key={item.title}
            className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/30 p-4"
          >
            <div className="shrink-0 rounded-lg bg-primary/10 p-2 text-primary">
              <item.icon className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="truncate text-xs text-muted-foreground">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Asistente IA */}
      <Card className="group relative flex h-[min(620px,80dvh)] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-primary/25 bg-card/60 p-4 shadow-2xl shadow-black/5 backdrop-blur-xl sm:min-h-[520px] sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 h-64 w-[min(16rem,100%)] rounded-full bg-primary/5 blur-[100px]"
        />
        <div className="flex shrink-0 items-center gap-3 border-b border-border/50 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <Sparkles className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-foreground">Asistente IA Mitra</h3>
            <p className="text-xs text-muted-foreground">
              Resuelve dudas al momento mientras esperas tu sesión con {MENTOR_PROFILE.name}.
            </p>
          </div>
        </div>
        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          <ChatPanel className="flex-1" />
        </div>
      </Card>
    </div>
  )
}
