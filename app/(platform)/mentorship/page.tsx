import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/data-access"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Clock,
  Sparkles,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Heart,
} from "lucide-react"
import dynamic from "next/dynamic"

const MentorshipBookingDialog = dynamic(() => import("@/components/mentorship/booking-dialog").then((mod) => mod.MentorshipBookingDialog), {
  ssr: false,
  loading: () => (
    <Button className="w-full mt-2 h-12 text-base bg-primary/20 text-foreground" disabled>
      Cargando agenda...
    </Button>
  ),
})

export const metadata: Metadata = {
  title: "Mentoría | Sendero",
  description: "Conecta 1 a 1 con tu mentor y acelera tu transformación.",
}

// Mentor por defecto si la base de datos de mentores aún está vacía
const defaultMentor = {
  id: "default-mentor",
  full_name: "Ainara",
  title: "Fundadora & Mentora Principal",
  bio: "Guía estratégica para líderes disruptivos. Te ayudo a desbloquear tu máximo potencial, conectar con tu propósito y escalar tu visión con claridad y enfoque láser.",
  avatar_url: "",
  specialties: ["Liderazgo", "Mentalidad", "Escalabilidad", "Propósito"],
  session_price: 150,
  session_duration_minutes: 60,
  is_active: true,
}

export default async function MentorshipPage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const supabase = await createClient()
  const { data: dbMentors } = await supabase
    .from("mentors")
    .select("*")
    .eq("is_active", true)
    .limit(1)

  const dbMentor = dbMentors && dbMentors.length > 0 ? dbMentors[0] : null
  const mentor = dbMentor ?? defaultMentor
  const mentorName = mentor.name ?? mentor.full_name ?? "Mentor"
  const isPlaceholder = !dbMentor

  return (
    <div className="space-y-12 max-w-5xl mx-auto pb-16 relative animation-fade-in">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-4 relative z-10 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
          <Sparkles className="w-4 h-4" />
          <span>Acelera tu evolución</span>
        </div>
        <h1 className="text-4xl font-light tracking-tight text-foreground sm:text-6xl">
          Mentoría{" "}
          <span className="font-semibold text-primary">1 a 1</span>
        </h1>
        <p className="text-muted-foreground text-base sm:text-xl max-w-2xl leading-relaxed">
          El conocimiento te da herramientas; la mentoría traza el mapa. Reserva
          tu sesión privada y recibe guía personalizada.
        </p>
      </div>

      {/* Hero mentor card */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-2xl shadow-black/5 overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-0">
          {/* Left: visual */}
          <div className="relative bg-gradient-to-br from-primary/20 via-primary/5 to-background min-h-[280px] flex flex-col items-center justify-center p-8">
            <Avatar className="h-40 w-40 border-[6px] border-background shadow-2xl">
              <AvatarImage src={mentor.avatar_url ?? ""} className="object-cover" />
              <AvatarFallback className="text-5xl bg-primary text-primary-foreground font-bold">
                {mentorName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Badge className="bg-emerald-500/15 text-emerald-700 border-none px-3 py-1 font-semibold mt-5">
              Disponible esta semana
            </Badge>
          </div>

          {/* Right: details */}
          <CardContent className="p-8 lg:p-10 flex flex-col justify-center space-y-5">
            <div>
              <h2 className="text-3xl font-bold text-foreground tracking-tight">
                {mentorName}
              </h2>
              <p className="text-sm font-medium text-primary mt-1 uppercase tracking-wider">
                {mentor.title || "Mentora Experta"}
              </p>
            </div>

            <p className="text-muted-foreground text-sm leading-relaxed">
              {mentor.bio ?? "Experta dedicada a guiarte en tu camino de transformación."}
            </p>

            <div className="flex flex-wrap gap-2">
              {(mentor.specialties ?? []).map((specialty: string, i: number) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="bg-muted text-muted-foreground"
                >
                  {specialty}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-6 pt-2 border-t border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 text-primary" />
                <span>{mentor.session_duration_minutes ?? 60} min</span>
              </div>
              {mentor.session_price && (
                <div className="text-sm text-foreground font-semibold">
                  {mentor.session_price} €
                </div>
              )}
            </div>

            {isPlaceholder ? (
              <Button
                className="w-full mt-2 h-12 text-base"
                disabled
                title="Aún no hay disponibilidad publicada"
              >
                Próximamente
              </Button>
            ) : (
              <MentorshipBookingDialog mentor={mentor} />
            )}
          </CardContent>
        </div>
      </Card>

      {/* Trust signals */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: ShieldCheck, title: "Pago seguro", desc: "Procesado por Stripe" },
          { icon: Heart, title: "Confidencial", desc: "Espacio íntimo y privado" },
          { icon: Clock, title: "Flexible", desc: "Cancelación 24h antes" },
        ].map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-card/30"
          >
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <item.icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* AI Companion teaser */}
      <Card className="border-dashed border-2 border-primary/20 bg-primary/5 backdrop-blur-sm overflow-hidden flex flex-col justify-center items-center text-center p-8 lg:p-12 relative group hover:bg-primary/10 transition-colors duration-500">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="h-20 w-20 bg-background rounded-2xl flex items-center justify-center shadow-lg border border-border/50 mb-6">
          <MessageSquare className="w-10 h-10 text-primary" />
        </div>
        <Badge className="bg-primary text-primary-foreground mb-4 font-bold tracking-widest uppercase">
          Próximamente
        </Badge>
        <h3 className="text-2xl font-semibold text-foreground mb-3">
          Sendero AI Companion
        </h3>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-md">
          Estamos entrenando una inteligencia artificial con el conocimiento
          completo de la plataforma. Pronto podrás chatear directamente y
          recibir respuestas en tiempo real basadas en la sabiduría de la mentora.
        </p>
        <Button variant="link" className="mt-6 text-primary" disabled>
          Saber más <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </Card>
    </div>
  )
}
