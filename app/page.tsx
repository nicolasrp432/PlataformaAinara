import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles,
  BookOpen,
  Users,
  Trophy,
  ArrowRight,
  Play,
  Heart,
  Star,
} from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Ainara</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="#formaciones"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Formaciones
            </Link>
            <Link
              href="#mentoria"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Mentoria
            </Link>
            <Link
              href="#comunidad"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Comunidad
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Iniciar Sesion</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Comenzar</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 lg:py-32">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="secondary" className="mb-4">
                <Star className="mr-1 h-3 w-3" />
                Plataforma de Transformacion
              </Badge>
              <h1 className="mb-6 text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Tu viaje hacia la{" "}
                <span className="text-primary">transformacion personal</span>{" "}
                comienza aqui
              </h1>
              <p className="mb-8 text-pretty text-lg text-muted-foreground sm:text-xl">
                Formaciones profundas, mentoria personalizada y una comunidad que
                te acompana en tu camino de crecimiento personal y espiritual.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="/register">
                    Comenzar mi viaje
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="#formaciones">
                    <Play className="mr-2 h-4 w-4" />
                    Ver formaciones
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="formaciones" className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Todo lo que necesitas para tu transformacion
              </h2>
              <p className="text-muted-foreground">
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
                description="Gana XP, mantén tu racha diaria y desbloquea logros mientras avanzas en tu camino."
              />
              <FeatureCard
                icon={Sparkles}
                title="Diario de Reflexiones"
                description="Espacio personal para documentar tus insights, aprendizajes y momentos de claridad."
              />
              <FeatureCard
                icon={Star}
                title="Certificados"
                description="Obtén certificados verificables al completar cada formacion como reconocimiento de tu dedicacion."
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <Card className="mx-auto max-w-4xl overflow-hidden">
              <div className="grid md:grid-cols-2">
                <div className="bg-primary p-8 text-primary-foreground md:p-12">
                  <h3 className="mb-4 text-2xl font-bold">
                    Comienza tu transformacion hoy
                  </h3>
                  <p className="mb-6 text-primary-foreground/90">
                    Accede a contenido gratuito y descubre si este camino es para
                    ti. Sin compromisos, solo crecimiento.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                      Lecciones de preview gratuitas
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                      Acceso a la comunidad
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                      Diario de reflexiones personal
                    </li>
                  </ul>
                </div>
                <CardContent className="flex flex-col justify-center p-8 md:p-12">
                  <CardHeader className="p-0">
                    <CardTitle className="text-xl">Crea tu cuenta gratuita</CardTitle>
                    <CardDescription>
                      Solo necesitas un email para empezar
                    </CardDescription>
                  </CardHeader>
                  <div className="mt-6">
                    <Button className="w-full" size="lg" asChild>
                      <Link href="/register">
                        Registrarse gratis
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <p className="mt-4 text-center text-sm text-muted-foreground">
                      ¿Ya tienes cuenta?{" "}
                      <Link href="/login" className="text-primary hover:underline">
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
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold">Ainara</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Plataforma de educacion para la transformacion personal y espiritual.
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground">
                Privacidad
              </Link>
              <Link href="/terms" className="hover:text-foreground">
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
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
