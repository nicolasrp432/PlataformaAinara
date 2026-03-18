import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarDays, Clock, Sparkles, MessageSquare, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Mentoría | Ainara",
  description: "Conecta 1 a 1 con expertos y acelera tu transformación.",
}

// Simulamos los datos de Ainara por si la base de datos de mentores aún está vacía
const defaultMentor = {
  id: "ainara-default",
  name: "Ainara",
  title: "Fundadora & Mentora Principal",
  bio: "Guía estratégica para líderes disruptivos. Te ayudo a desbloquear tu máximo potencial, conectar con tu propósito y escalar tu visión con claridad y enfoque láser.",
  avatar_url: "",
  specialties: ["Liderazgo", "Mentalidad", "Escalabilidad", "Propósito"],
  session_price: 150,
  session_duration_minutes: 60,
}

export default async function MentorshipPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Intentamos obtener mentores de la base de datos
  const { data: dbMentors } = await supabase
    .from("mentors")
    .select("*")
    .eq("is_active", true)

  // Si no hay mentores en la BD, usamos a Ainara por defecto
  const mentors = dbMentors && dbMentors.length > 0 ? dbMentors : [defaultMentor]

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-16 relative animation-fade-in">
      {/* Header Impactante */}
      <div className="flex flex-col items-center text-center gap-4 relative z-10 mb-6 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2 border border-primary/20">
          <Sparkles className="w-4 h-4" />
          <span>Acelera tu evolución</span>
        </div>
        <h1 className="text-4xl font-light tracking-tight text-foreground sm:text-6xl">
          Mentoría <span className="font-semibold text-primary">Exclusiva</span>
        </h1>
        <p className="text-muted-foreground text-base sm:text-xl max-w-2xl mt-2 leading-relaxed">
          El conocimiento te da las herramientas, pero la mentoría traza el mapa. Conecta 1 a 1 para recibir guía personalizada.
        </p>
      </div>

      {/* Grid de Mentores */}
      <div className="grid gap-8 lg:grid-cols-2">
        {mentors.map((mentor) => (
          <Card key={mentor.id} className="border-border/50 bg-card/40 backdrop-blur-xl shadow-xl shadow-black/5 overflow-hidden group hover:border-primary/40 transition-all duration-500 hover:-translate-y-1">
            <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/5 to-background w-full relative transition-all duration-500 group-hover:from-primary/30" />
            <CardContent className="px-6 sm:px-8 pb-8 relative z-10">
              <div className="flex justify-between items-end -mt-16 mb-6">
                <Avatar className="h-32 w-32 border-[6px] border-background shadow-2xl transition-transform duration-500 group-hover:scale-105 group-hover:rotate-2">
                  <AvatarImage src={mentor.avatar_url} className="object-cover" />
                  <AvatarFallback className="text-4xl bg-primary text-primary-foreground font-bold">
                    {mentor.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="mb-2">
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-none px-3 py-1 font-semibold">
                    Disponible
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">{mentor.name}</h2>
                  <p className="text-sm font-medium text-primary mt-1 uppercase tracking-wider">{mentor.title || "Mentor Experto"}</p>
                </div>

                <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                  {mentor.bio || "Experto dedicado a guiarte en tu camino de transformación."}
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  {mentor.specialties?.map((specialty: string, i: number) => (
                    <Badge key={i} variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted/80">
                      {specialty}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-6 pt-6 border-t border-border/50 mt-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{mentor.session_duration_minutes} min</span>
                  </div>
                  {mentor.session_price && (
                    <div className="flex items-center gap-2 text-sm text-foreground font-semibold">
                      <span>${mentor.session_price} USD</span>
                    </div>
                  )}
                </div>

                <Button className="w-full mt-6 bg-foreground text-background hover:bg-primary hover:text-primary-foreground group/btn transition-all duration-300 h-12 text-base shadow-lg">
                  <CalendarDays className="w-5 h-5 mr-no group-hover/btn:scale-110 transition-transform" />
                  Solicitar Sesión
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Teaser del Futuro Chatbot / Cerebro IA */}
        <Card className="border-dashed border-2 border-primary/20 bg-primary/5 backdrop-blur-sm overflow-hidden flex flex-col justify-center items-center text-center p-8 lg:p-12 relative group hover:bg-primary/10 transition-colors duration-500">
          <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="h-20 w-20 bg-background rounded-2xl flex items-center justify-center shadow-lg border border-border/50 mb-6 group-hover:scale-110 transition-transform duration-500">
            <MessageSquare className="w-10 h-10 text-primary" />
          </div>
          <Badge className="bg-primary text-primary-foreground mb-4 font-bold tracking-widest uppercase">
            Próximamente
          </Badge>
          <h3 className="text-2xl font-semibold text-foreground mb-3">Ainara AI Companion</h3>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed max-w-sm">
            Estamos entrenando a una inteligencia artificial con el conocimiento completo de la plataforma. Pronto podrás chatear directamente y recibir respuestas en tiempo real basadas en la sabiduría de Ainara.
          </p>
          <Button variant="link" className="mt-6 text-primary hover:text-primary/80" disabled>
            Saber más <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Card>
      </div>
    </div>
  )
}
