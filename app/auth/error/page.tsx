import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>Error de autenticacion</CardTitle>
          <CardDescription>
            Ha ocurrido un problema al intentar autenticarte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {decodeURIComponent(error)}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/login">Volver a iniciar sesion</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Ir al inicio</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
