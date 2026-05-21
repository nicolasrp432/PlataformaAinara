"use client"

import { useState } from "react"
import { Save, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"

interface Setting {
  key: string
  value: string
  label: string
  description?: string | null
}

const XP_KEYS = ["xp_per_lesson", "xp_per_module", "xp_per_streak", "xp_level_threshold"]
const GENERAL_KEYS = ["site_name", "welcome_message"]

export function SettingsClient({ settings: initialSettings }: { settings: Setting[] }) {
  const [settings, setSettings] = useState<Record<string, string>>(
    Object.fromEntries(initialSettings.map((s) => [s.key, s.value]))
  )
  const [saving, setSaving] = useState(false)

  const settingsMap = Object.fromEntries(initialSettings.map((s) => [s.key, s]))

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Error al guardar." }))
        toast.error(error ?? "Error al guardar la configuración.")
        return
      }
      toast.success("Configuración guardada correctamente.")
    } catch {
      toast.error("Error de conexión.")
    } finally {
      setSaving(false)
    }
  }

  const renderField = (key: string) => {
    const setting = settingsMap[key]
    if (!setting) return null
    const value = settings[key] ?? setting.value
    const isLong = key === "welcome_message"

    return (
      <div key={key} className="space-y-1.5">
        <Label htmlFor={key} className="text-sm font-medium">
          {setting.label}
        </Label>
        {isLong ? (
          <Textarea
            id={key}
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            rows={3}
            className="resize-none text-sm"
          />
        ) : (
          <Input
            id={key}
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            type={XP_KEYS.includes(key) ? "number" : "text"}
            min={XP_KEYS.includes(key) ? 0 : undefined}
            className="text-sm"
          />
        )}
        {setting.description && (
          <p className="text-xs text-muted-foreground">{setting.description}</p>
        )}
      </div>
    )
  }

  if (initialSettings.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Aplica primero la migración{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">0007_platform_settings.sql</code>{" "}
            en Supabase para activar esta sección.
          </p>
        </div>
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Settings className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-muted-foreground">Tabla de configuración no encontrada</p>
            <p className="text-sm text-muted-foreground/70 mt-1 max-w-xs">
              Ejecuta <code className="text-xs bg-muted px-1 rounded">migrations/0007_platform_settings.sql</code> en el SQL Editor de Supabase.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ajustes generales de la plataforma.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>

      {/* General settings */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
          <CardDescription>Información básica de la plataforma</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {GENERAL_KEYS.map(renderField)}
        </CardContent>
      </Card>

      {/* XP & Gamification */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">XP y Gamificación</CardTitle>
          <CardDescription>Puntos de experiencia y progresión de niveles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {XP_KEYS.map(renderField)}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
