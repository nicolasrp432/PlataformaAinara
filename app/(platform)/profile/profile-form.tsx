"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2 } from "lucide-react"
import { updateProfile } from "./actions"

interface ProfileFormProps {
  initialData: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage(null)
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      try {
        const result = await updateProfile(formData)
        if (result.error) {
          setMessage({ type: 'error', text: result.error })
        } else {
          setMessage({ type: 'success', text: "Perfil actualizado correctamente." })
        }
      } catch (error) {
        setMessage({ type: 'error', text: "Ocurrió un error inesperado al guardar." })
      }
    })
  }

  return (
    <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Configuración de la Cuenta</CardTitle>
        <CardDescription>
          Actualiza cómo te ven otros exploradores dentro de la plataforma.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="full_name" className="text-sm font-medium">
                Nombre de Aventurero
              </Label>
              <Input 
                id="full_name" 
                name="full_name" 
                defaultValue={initialData.full_name} 
                placeholder="Ej. Alex Rivera" 
                className="bg-background/50 border-border/50 focus:border-primary/50"
                required 
              />
              <p className="text-xs text-muted-foreground">
                Este nombre será visible en La Taberna y tus logros.
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="avatar_url" className="text-sm font-medium">
                URL del Avatar (Opcional)
              </Label>
              <Input 
                id="avatar_url" 
                name="avatar_url" 
                defaultValue={initialData.avatar_url || ""} 
                placeholder="https://ejemplo.com/mifoto.jpg" 
                className="bg-background/50 border-border/50 focus:border-primary/50"
              />
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
              message.type === 'error' 
                ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
            }`}>
              {message.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
              <p>{message.text}</p>
            </div>
          )}

          <div className="flex justify-end border-t border-border/50 pt-4">
            <Button 
              type="submit" 
              disabled={isPending} 
              className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[140px] shadow-sm transition-all"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
