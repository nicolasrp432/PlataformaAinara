import type { Metadata } from "next"
import Link from "next/link"
import { RegisterForm } from "./register-form"
import { Sparkles } from "lucide-react"

export const metadata: Metadata = {
  title: "Crear Cuenta",
  description: "Crea tu cuenta en Ainara y comienza tu viaje de transformacion",
}

export default function RegisterPage() {
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
              &ldquo;La transformacion no es algo que sucede de la noche a la
              manana. Es un proceso continuo de crecimiento, aprendizaje y
              descubrimiento de tu verdadero ser.&rdquo;
            </p>
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
              Crea tu cuenta
            </h1>
            <p className="text-sm text-muted-foreground">
              Comienza tu viaje de transformacion personal
            </p>
          </div>

          <RegisterForm />

          <p className="px-8 text-center text-sm text-muted-foreground">
            Al registrarte, aceptas nuestros{" "}
            <Link
              href="/terms"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terminos de Servicio
            </Link>{" "}
            y{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-4 hover:text-primary"
            >
              Politica de Privacidad
            </Link>
          </p>

          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="underline underline-offset-4 hover:text-primary"
            >
              Inicia sesion
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
