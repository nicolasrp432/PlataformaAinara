"use client"

import * as React from "react"
import { useTransition } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Send, History, Users } from "lucide-react"
import { sendCampaignAction } from "./actions"

interface Campaign {
  id: string
  title: string
  body: string
  recipient_count: number
  sent_at: string
  channel: string
  audience: { type: string; value?: unknown }
}

interface Formation {
  id: string
  title: string
}

interface Props {
  campaigns: Campaign[]
  formations: Formation[]
}

function formatAudience(audience: { type: string; value?: unknown }) {
  if (audience.type === "all") return "Todos los usuarios"
  if (audience.type === "role") return `Rol: ${audience.value}`
  if (audience.type === "formation") return `Formación específica`
  if (audience.type === "user_ids") {
    const ids = audience.value as string[]
    return `${ids.length} usuario(s) específico(s)`
  }
  return audience.type
}

export function NotificationsAdminClient({ campaigns, formations }: Props) {
  const [isPending, startTransition] = useTransition()
  const [audienceType, setAudienceType] = React.useState("all")
  const formRef = React.useRef<HTMLFormElement>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await sendCampaignAction(formData)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success(`Notificación enviada a ${result.recipientCount} usuario(s).`)
      formRef.current?.reset()
      setAudienceType("all")
    })
  }

  return (
    <Tabs defaultValue="send">
      <TabsList>
        <TabsTrigger value="send" className="gap-2">
          <Send className="h-3.5 w-3.5" /> Enviar
        </TabsTrigger>
        <TabsTrigger value="history" className="gap-2">
          <History className="h-3.5 w-3.5" /> Historial
        </TabsTrigger>
      </TabsList>

      {/* ── Tab Enviar ─────────────────────────────────────────────────────── */}
      <TabsContent value="send">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nueva notificación</CardTitle>
            <CardDescription>
              Los usuarios la verán en tiempo real en la campana del sidebar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Título *</Label>
                <Input id="title" name="title" required maxLength={200} placeholder="Ej: Nueva formación disponible" />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="body">Mensaje *</Label>
                <Textarea
                  id="body"
                  name="body"
                  required
                  rows={3}
                  maxLength={2000}
                  placeholder="Contenido de la notificación…"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="link">Enlace (opcional)</Label>
                <Input id="link" name="link" type="url" placeholder="https://… o /ruta-interna" />
              </div>

              <div className="grid gap-2">
                <Label>Audiencia</Label>
                <Select
                  name="audienceType"
                  value={audienceType}
                  onValueChange={setAudienceType}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5" /> Todos los usuarios
                      </span>
                    </SelectItem>
                    <SelectItem value="role">Por rol (estudiante / mentor)</SelectItem>
                    <SelectItem value="formation">Por formación</SelectItem>
                    <SelectItem value="user_ids">IDs específicos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {audienceType === "role" && (
                <div className="grid gap-2">
                  <Label htmlFor="audienceValue">Rol</Label>
                  <Select name="audienceValue" defaultValue="student">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Estudiante</SelectItem>
                      <SelectItem value="mentor">Mentor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {audienceType === "formation" && (
                <div className="grid gap-2">
                  <Label htmlFor="audienceValue">Formación</Label>
                  <Select name="audienceValue">
                    <SelectTrigger>
                      <SelectValue placeholder="Elige una formación" />
                    </SelectTrigger>
                    <SelectContent>
                      {formations.map((f) => (
                        <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {audienceType === "user_ids" && (
                <div className="grid gap-2">
                  <Label htmlFor="audienceValue">IDs de usuarios (separados por coma)</Label>
                  <Textarea
                    id="audienceValue"
                    name="audienceValue"
                    rows={3}
                    placeholder="uuid1, uuid2, uuid3…"
                  />
                </div>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={isPending} className="gap-2">
                  {isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Enviando…</>
                  ) : (
                    <><Send className="h-4 w-4" /> Enviar notificación</>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* ── Tab Historial ──────────────────────────────────────────────────── */}
      <TabsContent value="history">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Historial de envíos</CardTitle>
            <CardDescription>Últimas 20 campañas enviadas.</CardDescription>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No hay campañas aún.</p>
            ) : (
              <div className="space-y-3">
                {campaigns.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg border border-border/50 p-4 space-y-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-snug">{c.title}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(c.sent_at).toLocaleDateString("es-ES", {
                          day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{c.body}</p>
                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-xs text-muted-foreground">
                        {formatAudience(c.audience)} · {c.recipient_count} destinatarios
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
