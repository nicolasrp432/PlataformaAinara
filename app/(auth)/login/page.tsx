import type { Metadata } from "next"
import Link from "next/link"
import { LoginForm } from "./login-form"
import { Sparkles } from "lucide-react"

export const metadata: Metadata = {
  title: "Iniciar Sesion",
  description: "Accede a tu cuenta en Ainara",
}

export default function LoginPage() {
  return (
    <div className="container relative flex min-h-screen flex-col items-center justify-center px-4 md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      {/* Left side - Branding */}
      <div className="relative hidden h-full flex-col bg-muted p-10 text-foreground lg:flex">
        <div className="absolute inset-0 bg-primary" />
        <div className="relative z-20 flex items-center gap-2 text-lg font-medium text-primary-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/20">
            <Sparkles className="h-5 w-5" />
          </div>
          Ainara
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg text-primary-foreground/90">
              &ldquo;El viaje de mil millas comienza con un solo paso. Cada dia
              que dedicas a tu crecimiento personal es un paso hacia la mejor
              version de ti mismo.&rdquo;
            </p>
            <footer className="text-sm text-primary-foreground/70">
              - Lao Tzu
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <div className="mb-4 flex justify-center lg:hidden">
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <Sparkles className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-2xl font-bold">Ainara</span>
              </Link>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Bienvenido de nuevo
            </h1>
            <p className="text-sm text-muted-foreground">
              Ingresa tus credenciales para acceder a tu cuenta
            </p>
          </div>

          <LoginForm />

          <p className="px-8 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link
              href="/register"
              className="underline underline-offset-4 hover:text-primary"
            >
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
