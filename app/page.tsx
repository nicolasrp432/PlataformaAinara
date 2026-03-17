import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Sparkles,
  BookOpen,
  Users,
  Trophy,
  ArrowRight,
  Play,
  Heart,
  Star,
  Gem,
} from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex h-20 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-light tracking-wide">Ainara</span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="#formaciones"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Formaciones
            </Link>
            <Link
              href="#mentoria"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Mentoria
            </Link>
            <Link
              href="#comunidad"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Comunidad
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground" asChild>
              <Link href="/login">Iniciar Sesion</Link>
            </Button>
            <Button className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90" asChild>
              <Link href="/register">Comenzar</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-32 lg:py-44">
          {/* Subtle golden gradient overlay */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="absolute top-20 right-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-20 left-1/4 h-64 w-64 rounded-full bg-accent/5 blur-3xl" />
          
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2">
                <Gem className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Plataforma de Transformacion</span>
              </div>
              <h1 className="mb-8 text-balance text-5xl font-light tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                Tu viaje hacia la{" "}
                <span className="text-gold-gradient font-normal">transformacion</span>{" "}
                comienza aqui
              </h1>
              <p className="mx-auto mb-12 max-w-2xl text-pretty text-lg text-muted-foreground leading-relaxed sm:text-xl">
                Formaciones profundas, mentoria personalizada y una comunidad que
                te acompana en tu camino de crecimiento personal y espiritual.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" className="h-14 px-8 bg-gradient-to-r from-primary to-accent text-primary-foreground text-base hover:opacity-90" asChild>
                  <Link href="/register">
                    Comenzar mi viaje
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="h-14 px-8 border-primary/30 text-base hover:bg-primary/5" asChild>
                  <Link href="#formaciones">
                    <Play className="mr-2 h-5 w-5" />
                    Ver formaciones
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="formaciones" className="py-32 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-20 max-w-2xl text-center">
              <h2 className="mb-6 text-4xl font-light tracking-tight sm:text-5xl">
                Todo lo que necesitas para tu{" "}
                <span className="text-gold-gradient font-normal">transformacion</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Una plataforma completa disenada para guiarte en cada paso de tu
                desarrollo personal.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={BookOpen}
                title="Formaciones Profundas"
                description="Cursos estructurados con videos, ejercicios practicos y recursos descargables para tu aprendizaje."
              />
              <FeatureCard
                icon={Users}
                title="Mentoria Personalizada"
                description="Sesiones 1:1 con mentores experimentados que te guian en tu proceso de transformacion."
              />
              <FeatureCard
                icon={Heart}
                title="Comunidad de Apoyo"
                description="Conecta con personas afines en la Taberna, comparte reflexiones y crece junto a otros."
              />
              <FeatureCard
                icon={Trophy}
                title="Sistema de Progreso"
                description="Gana XP, manten tu racha diaria y desbloquea logros mientras avanzas en tu camino."
              />
              <FeatureCard
                icon={Sparkles}
                title="Diario de Reflexiones"
                description="Espacio personal para documentar tus insights, aprendizajes y momentos de claridad."
              />
              <FeatureCard
                icon={Star}
                title="Certificados"
                description="Obten certificados verificables al completar cada formacion como reconocimiento de tu dedicacion."
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32">
          <div className="container mx-auto px-4">
            <Card className="mx-auto max-w-5xl overflow-hidden border-primary/20 shadow-lg shadow-primary/5">
              <div className="grid md:grid-cols-2">
                <div className="bg-gradient-to-br from-secondary to-secondary/90 p-10 text-secondary-foreground md:p-14">
                  <h3 className="mb-6 text-3xl font-light">
                    Comienza tu transformacion hoy
                  </h3>
                  <p className="mb-8 text-secondary-foreground/80 leading-relaxed">
                    Accede a contenido gratuito y descubre si este camino es para
                    ti. Sin compromisos, solo crecimiento.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                      <span className="text-sm">Lecciones de preview gratuitas</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                      <span className="text-sm">Acceso a la comunidad</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                      <span className="text-sm">Diario de reflexiones personal</span>
                    </li>
                  </ul>
                </div>
                <CardContent className="flex flex-col justify-center p-10 md:p-14">
                  <CardHeader className="p-0">
                    <CardTitle className="text-2xl font-light">Crea tu cuenta gratuita</CardTitle>
                    <CardDescription className="mt-2 text-base">
                      Solo necesitas un email para empezar
                    </CardDescription>
                  </CardHeader>
                  <div className="mt-8">
                    <Button className="w-full h-14 bg-gradient-to-r from-primary to-accent text-primary-foreground text-base hover:opacity-90" size="lg" asChild>
                      <Link href="/register">
                        Registrarse gratis
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                    <p className="mt-6 text-center text-sm text-muted-foreground">
                      ¿Ya tienes cuenta?{" "}
                      <Link href="/login" className="text-primary font-medium hover:underline">
                        Inicia sesion
                      </Link>
                    </p>
                  </div>
                </CardContent>
              </div>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-light">Ainara</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Plataforma de educacion para la transformacion personal y espiritual.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-primary transition-colors">
                Privacidad
              </Link>
              <Link href="/terms" className="hover:text-primary transition-colors">
                Terminos
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <Card className="luxury-card bg-card hover:shadow-lg transition-all duration-300">
      <CardHeader>
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10">
          <Icon className="h-7 w-7 text-primary" />
        </div>
        <CardTitle className="text-xl font-normal">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  )
}
