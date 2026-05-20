"use client"

import { useState, useTransition } from "react"
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
import { Loader2, ShieldCheck, Bell, Mail, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { changePasswordAction, requestAccountDeactivation } from "./actions"

interface SettingsClientProps {
  email: string
}

export function SettingsClient({ email }: SettingsClientProps) {
  const [isChanging, startChange] = useTransition()
  const [isDeactivating, startDeactivate] = useTransition()
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [productUpdates, setProductUpdates] = useState(false)

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

      {/* Danger zone */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" /> Zona delicada
          </CardTitle>
          <CardDescription>
            Desactivar tu cuenta suspende tu acceso. Tus datos se conservan; puedes volver más adelante.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive">
                Desactivar mi cuenta
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Desactivar tu cuenta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Perderás acceso a todas las formaciones y a la comunidad. Tus datos
                  se conservan para que puedas reactivar la cuenta contactándonos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeactivate}
                  disabled={isDeactivating}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeactivating ? "Desactivando..." : "Sí, desactivar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
