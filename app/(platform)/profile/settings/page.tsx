import { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/data-access"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { SettingsClient } from "./settings-client"

export const metadata: Metadata = {
  title: "Ajustes | Sendero",
  description: "Configura tus preferencias, seguridad y notificaciones.",
}

export default async function ProfileSettingsPage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-10">
      <div className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link href="/profile">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Volver al perfil
          </Link>
        </Button>
        <h1 className="text-3xl font-light tracking-tight text-foreground">
          Ajustes y <span className="font-semibold text-primary">Seguridad</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          Personaliza tu experiencia y gestiona tu cuenta.
        </p>
      </div>

      <SettingsClient email={user.email ?? ""} />
    </div>
  )
}
