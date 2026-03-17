import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ForgotPasswordForm } from "./forgot-password-form"

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">A</span>
            </div>
          </div>
          <CardTitle className="text-2xl">Recuperar contrasena</CardTitle>
          <CardDescription>
            Ingresa tu email y te enviaremos un enlace para restablecer tu contrasena
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Recordaste tu contrasena? </span>
            <Link href="/login" className="text-primary hover:underline font-medium">
              Iniciar sesion
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
