import { Metadata } from "next"
import { requireMembership } from "@/lib/guards"
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
  // Sesión + suscripción activa. Segunda capa junto al middleware.
  await requireMembership("/mentorship")

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

  return (
    <div className="relative mx-auto max-w-5xl space-y-12 pb-16 animation-fade-in">
      {/* Header */}
      <header className="relative z-10 flex flex-col items-center gap-4 pt-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" aria-hidden />
          <span>Una sola mentora, toda su atención</span>
        </div>
        <h1 className="text-balance text-4xl font-light tracking-tight text-foreground sm:text-6xl">
          Mentoría <span className="font-semibold text-primary">1 a 1</span>
        </h1>
        <p className="max-w-2xl text-balance text-base leading-relaxed text-muted-foreground sm:text-xl">
          {MENTOR_PROFILE.tagline}
        </p>
      </header>

      <MentorHero mentor={mentor} />

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
          { icon: Clock, title: "Flexible", desc: "Cancelación 24h antes" },
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
      <Card className="group relative flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-primary/25 bg-card/60 p-4 shadow-2xl shadow-black/5 backdrop-blur-xl sm:min-h-[520px] sm:p-8">
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
