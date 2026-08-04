"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Loader2, ShieldCheck, Bell, Mail, Trash2, Eye, MessageCircle, Download } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { changePasswordAction, requestAccountDeactivation, updatePrivacySettings } from "./actions"

interface SettingsClientProps {
  email: string
  profileVisibility?: "private" | "community" | "public"
  allowDirectMessages?: boolean
}

export function SettingsClient({
  email,
  profileVisibility = "community",
  allowDirectMessages = true,
}: SettingsClientProps) {
  const [isChanging, startChange] = useTransition()
  const [isDeactivating, startDeactivate] = useTransition()
  const [isUpdatingPrivacy, startPrivacy] = useTransition()
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [productUpdates, setProductUpdates] = useState(false)
  const [visibility, setVisibility] = useState(profileVisibility)
  const [allowDMs, setAllowDMs] = useState(allowDirectMessages)

  const handlePrivacySave = () => {
    startPrivacy(async () => {
      const formData = new FormData()
      formData.set("profile_visibility", visibility)
      formData.set("allow_direct_messages", String(allowDMs))
      const result = await updatePrivacySettings(formData)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success("Configuración de privacidad guardada.")
    })
  }

  const handlePasswordChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startChange(async () => {
      const result = await changePasswordAction(formData)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success("Contraseña actualizada.")
      e.currentTarget.reset()
    })
  }

  const handleDeactivate = () => {
    startDeactivate(async () => {
      const result = await requestAccountDeactivation()
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success("Cuenta desactivada. Te ayudaremos a reactivarla cuando quieras volver.")
    })
  }

  return (
    <div className="space-y-6">
      {/* Privacidad */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" /> Privacidad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border/50 p-4 gap-4">
            <div className="flex items-center gap-3">
              <Eye className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium">Visibilidad del perfil</p>
                <p className="text-xs text-muted-foreground">Quién puede ver tu página pública.</p>
              </div>
            </div>
            <Select value={visibility} onValueChange={(v) => setVisibility(v as typeof visibility)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Público</SelectItem>
                <SelectItem value="community">Comunidad</SelectItem>
                <SelectItem value="private">Privado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Mensajes directos</p>
                <p className="text-xs text-muted-foreground">Permite que otros usuarios te escriban.</p>
              </div>
            </div>
            <Switch checked={allowDMs} onCheckedChange={setAllowDMs} />
          </div>

          <div className="flex justify-end">
            <Button size="sm" onClick={handlePrivacySave} disabled={isUpdatingPrivacy}>
              {isUpdatingPrivacy && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Guardar privacidad
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification preferences (UI only — backend TODO) */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" /> Notificaciones
          </CardTitle>
          <CardDescription>
            Decide cuándo y cómo te avisamos. (Próximamente persistencia)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Emails de actividad</p>
                <p className="text-xs text-muted-foreground">Avisos de mentoría y respuestas a tus reflexiones.</p>
              </div>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Novedades del producto</p>
                <p className="text-xs text-muted-foreground">Nuevas formaciones, mejoras y eventos.</p>
              </div>
            </div>
            <Switch
              checked={productUpdates}
              onCheckedChange={setProductUpdates}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" /> Seguridad
          </CardTitle>
          <CardDescription>
            Tu correo es <span className="font-medium text-foreground">{email}</span>. Cambia tu contraseña cuando lo necesites.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="newPassword">Nueva contraseña</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                minLength={8}
                required
                autoComplete="new-password"
                className="bg-background/50 border-border/50"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirma la contraseña</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                minLength={8}
                required
                autoComplete="new-password"
                className="bg-background/50 border-border/50"
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isChanging}>
                {isChanging && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {isChanging ? "Actualizando..." : "Cambiar contraseña"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tus datos — derechos RGPD */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" /> Tus datos
          </CardTitle>
          <CardDescription>
            Descarga una copia de todo lo que guardamos sobre ti: perfil, diario,
            progreso, mensajes y carta natal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" asChild>
            <a href="/api/account/export" download>
              <Download className="mr-2 h-4 w-4" />
              Descargar mis datos
            </a>
          </Button>
          <p className="text-xs text-muted-foreground">
            Se descarga un archivo JSON. Puedes ejercer el resto de tus derechos
            escribiendo al contacto indicado en la{" "}
            <Link href="/privacy" className="text-primary underline underline-offset-4">
              Política de Privacidad
            </Link>
            .
          </p>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" /> Zona delicada
          </CardTitle>
          <CardDescription>
            Solicitar la baja suspende tu acceso de inmediato y registra la petición
            de eliminación, que atenderemos en un plazo máximo de 30 días.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
                Solicitar la eliminación de mi cuenta
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Solicitar la eliminación de tu cuenta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Perderás el acceso a las formaciones y a la comunidad de inmediato.
                  Tus datos se eliminarán en un plazo máximo de 30 días, salvo la
                  información de facturación, que la ley obliga a conservar. Si
                  cambias de idea antes de que se complete, escríbenos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeactivate}
                  disabled={isDeactivating}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeactivating ? "Enviando..." : "Sí, solicitar la baja"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
