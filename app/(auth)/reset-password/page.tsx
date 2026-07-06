import type { Metadata } from "next"
import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BrandMark } from "@/components/ui/brand"
import { getAuthUser } from "@/lib/data-access"
import { ResetPasswordForm } from "./reset-password-form"

export const metadata: Metadata = {
  title: "Nueva contraseña",
}

export default async function ResetPasswordPage() {
  // El enlace del correo pasa por /auth/confirm o /auth/callback, que crean
  // la sesión de recuperación. Sin sesión, el formulario fallaría siempre
  // ("Auth session missing"), así que mostramos un estado claro.
  const user = await getAuthUser()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <BrandMark size="md" />
          </div>
          {user ? (
            <>
              <CardTitle className="text-2xl">Nueva contraseña</CardTitle>
              <CardDescription>Ingresa tu nueva contraseña</CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-2xl">Enlace inválido o caducado</CardTitle>
              <CardDescription>
                Este enlace de recuperación ya no es válido
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
          {user ? (
            <ResetPasswordForm />
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <p>
                  Los enlaces de recuperación caducan y solo pueden usarse una
                  vez. Solicita uno nuevo para continuar.
                </p>
              </div>
              <Button asChild className="w-full">
                <Link href="/forgot-password">Solicitar nuevo enlace</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Volver a iniciar sesión</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
