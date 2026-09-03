import Image from "next/image"
import { Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MentorshipBookingDialog } from "@/components/mentorship/booking-dialog"
import { MENTOR_PROFILE, MENTOR_EXPERIENCE_LABEL } from "@/lib/mentor"

interface MentorHeroProps {
  mentor: {
    id: string
    name: string
    full_name: string
    session_price: number
    session_duration_minutes: number
  }
}

/**
 * Tarjeta de presentación de la mentora.
 *
 * El retrato ocupa su columna a sangre en lugar de reducirse a un círculo:
 * quien reserva quiere ver a la persona que le va a acompañar, y esa es la
 * primera pregunta que responde la página. El velo cálido inferior sostiene
 * la insignia sin comerse la cara.
 */
export function MentorHero({ mentor }: MentorHeroProps) {
  return (
    <Card className="overflow-hidden border-border/50 bg-card/60 shadow-2xl shadow-black/5 backdrop-blur-xl">
      <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
        <div className="relative min-h-[320px] bg-gradient-to-br from-primary/15 via-primary/5 to-background sm:min-h-[380px] lg:min-h-full">
          <Image
            src={MENTOR_PROFILE.portrait}
            alt={`Retrato de ${MENTOR_PROFILE.name}`}
            fill
            sizes="(max-width: 1024px) 100vw, 45vw"
            priority
            className="object-cover object-top"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/55 to-transparent"
          />
          <Badge className="absolute bottom-4 left-4 border-none bg-background/90 px-3 py-1 font-semibold text-foreground backdrop-blur-md">
            {MENTOR_EXPERIENCE_LABEL}
          </Badge>
        </div>

        <CardContent className="flex flex-col justify-center space-y-6 p-6 sm:p-8 lg:p-10">
          <div className="min-w-0">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground">
              {MENTOR_PROFILE.name}
            </h2>
            <p className="mt-1 text-sm font-medium uppercase tracking-wider text-primary">
              {MENTOR_PROFILE.title}
            </p>
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">
            {MENTOR_PROFILE.bio}
          </p>

          <div className="flex flex-wrap gap-2">
            {MENTOR_PROFILE.specialties.map((specialty) => (
              <Badge
                key={specialty}
                variant="secondary"
                className="bg-muted text-muted-foreground"
              >
                {specialty}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-6 border-t border-border/50 pt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 text-primary" aria-hidden />
              <span>{mentor.session_duration_minutes} min</span>
            </div>
            <div className="text-sm font-semibold text-foreground">
              {mentor.session_price} €
            </div>
          </div>

          <MentorshipBookingDialog mentor={mentor} />
        </CardContent>
      </div>
    </Card>
  )
}
