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
  ShieldCheck,
  Heart,
} from "lucide-react"
import { MentorshipBookingDialog } from "@/components/mentorship/booking-dialog"
import { ChatPanel } from "@/components/ai/chat-panel"

export const metadata: Metadata = {
  title: "Mentoría | Μήτρα",
  description: "Conecta 1 a 1 con tu mentor y acelera tu transformación.",
}

// Mentor por defecto si la base de datos de mentores aún está vacía
const defaultMentor = {
  id: "default-mentor",
  full_name: "Ainara",
  title: "Fundadora & Mentora Principal",
  bio: "Guía estratégica para líderes disruptivos. Te ayudo a desbloquear tu máximo potencial, conectar con tu propósito y escalar tu visión con claridad y enfoque láser.",
  avatar_url: "/ainara.png",
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

      {/* AI Companion - Active Chat */}
      <Card className="border border-primary/25 bg-card/60 backdrop-blur-xl shadow-2xl shadow-black/5 p-6 sm:p-8 flex flex-col min-h-[520px] rounded-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="flex items-center gap-3 pb-4 border-b border-border/50 shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Asistente IA Μήτρα</h3>
            <p className="text-xs text-muted-foreground">
              Haz preguntas en tiempo real sobre tus formaciones y la sabiduría de tu mentora.
            </p>
          </div>
        </div>
        <div className="flex-1 min-h-0 mt-4 flex flex-col">
          <ChatPanel className="flex-1" />
        </div>
      </Card>
    </div>
  )
}
