"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Save,
  Eye,
  Trash2,
  Video,
  FileText,
  Clock,
  Star,
  Play,
  Pencil,
  HelpCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { VideoUploader } from "@/components/admin/video-uploader"
import type { Lesson as BaseLesson } from "@/types"

type LessonWithContext = BaseLesson & {
  xp_reward?: number
  sort_order?: number
  module_title: string
  formation_title: string
  formation_id: string
}

export default function LessonEditorPage() {
  const params = useParams()
  const router = useRouter()
  const lessonId = params?.id as string
  const isNew = lessonId === "new"

  const [lesson, setLesson] = useState<LessonWithContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("details")

  useEffect(() => {
    if (isNew) {
      setLesson({
        id: "",
        module_id: "",
        title: "",
        description: "",
        video_url: null,
        duration_seconds: 0,
        content_type: "video",
        sort_order: 0,
        xp_reward: 25,
        is_free: false,
        is_published: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        module_title: "",
        formation_title: "",
        formation_id: "",
      } as LessonWithContext)
      setLoading(false)
      return
    }

    fetch(`/api/admin/lessons/${lessonId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Leccion no encontrada")
        return res.json()
      })
      .then((data) => {
        setLesson(data)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [lessonId, isNew])

  const handleSave = async () => {
    if (!lesson || isNew) return
    setSaving(true)
    setSaveError(null)

    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: lesson.title,
          description: lesson.description,
          video_url: lesson.video_url,
          duration_seconds: lesson.duration_seconds,
          xp_reward: lesson.xp_reward,
          is_free: lesson.is_free,
          is_published: lesson.is_published,
          content_type: lesson.content_type,
          sort_order: lesson.sort_order,
          transcript: lesson.transcript ?? null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setSaveError(data.error || "Error al guardar")
      }
    } catch {
      setSaveError("Error de conexión al guardar")
    } finally {
      setSaving(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!lesson) {
    return <div className="p-8 text-muted-foreground">Leccion no encontrada</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <span>{lesson.formation_title}</span>
              {lesson.formation_title && <span>/</span>}
              <span>{lesson.module_title}</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {isNew ? "Nueva Leccion" : lesson.title || "Sin título"}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && lesson.video_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={`/learn/${lesson.formation_id}/${lessonId}`} target="_blank" rel="noopener noreferrer">
                <Eye className="h-4 w-4 mr-2" />
                Vista Previa
              </a>
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving || isNew}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

      {saveError && (
        <div className="px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          {saveError}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Detalles</TabsTrigger>
          <TabsTrigger value="video">Video</TabsTrigger>
          <TabsTrigger value="resources">Recursos</TabsTrigger>
          <TabsTrigger value="settings">Configuracion</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informacion de la Leccion</CardTitle>
              <CardDescription>Configura el titulo y descripcion de esta leccion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titulo</Label>
                <Input
                  id="title"
                  value={lesson.title}
                  onChange={(e) => setLesson({ ...lesson, title: e.target.value })}
                  placeholder="Ej: Introduccion a la meditacion"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripcion</Label>
                <Textarea
                  id="description"
                  value={lesson.description || ""}
                  onChange={(e) => setLesson({ ...lesson, description: e.target.value })}
                  placeholder="Describe el contenido de esta leccion..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="content-type">Tipo de Contenido</Label>
                  <Select
                    value={lesson.content_type}
                    onValueChange={(value) =>
                      setLesson({ ...lesson, content_type: value as BaseLesson["content_type"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          Video
                        </div>
                      </SelectItem>
                      <SelectItem value="text">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Texto/Artículo
                        </div>
                      </SelectItem>
                      <SelectItem value="audio">
                        <div className="flex items-center gap-2">
                          <Play className="h-4 w-4" />
                          Audio
                        </div>
                      </SelectItem>
                      <SelectItem value="exercise">
                        <div className="flex items-center gap-2">
                          <Pencil className="h-4 w-4" />
                          Ejercicio Práctico
                        </div>
                      </SelectItem>
                      <SelectItem value="quiz">
                        <div className="flex items-center gap-2">
                          <HelpCircle className="h-4 w-4" />
                          Quiz
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="xp">XP Recompensa</Label>
                  <Input
                    id="xp"
                    type="number"
                    value={lesson.xp_reward ?? 25}
                    onChange={(e) =>
                      setLesson({ ...lesson, xp_reward: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              {/* Exercise instructions — visible only when content_type is exercise */}
              {lesson.content_type === "exercise" && (
                <div className="space-y-2 border-t border-border/50 pt-4">
                  <Label htmlFor="transcript">
                    <Pencil className="h-4 w-4 inline mr-1" />
                    Instrucciones del Ejercicio
                  </Label>
                  <Textarea
                    id="transcript"
                    value={lesson.transcript || ""}
                    onChange={(e) => setLesson({ ...lesson, transcript: e.target.value })}
                    placeholder="Describe paso a paso qué debe hacer el alumno en este ejercicio..."
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Las instrucciones se mostrarán en la vista del ejercicio. Puedes usar saltos de línea para mejor legibilidad.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Video Tab */}
        <TabsContent value="video" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Video de la Leccion</CardTitle>
              <CardDescription>
                Sube el video directamente a Cloudflare Stream. MP4, MOV o WebM hasta 5GB.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VideoUploader
                lessonId={lesson.id || undefined}
                currentVideoUrl={lesson.video_url || null}
                currentDuration={lesson.duration_seconds || undefined}
                onUploadComplete={(data) => {
                  setLesson({
                    ...lesson,
                    video_url: data.videoUrl,
                    duration_seconds: Math.round(data.duration),
                  })
                }}
                onUploadError={(err) => setSaveError(`Error de video: ${err.message}`)}
              />
            </CardContent>
          </Card>

          {/* Video Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Configuracion del Video</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    <Clock className="h-4 w-4 inline mr-1" />
                    Duracion (segundos)
                  </Label>
                  <Input
                    type="number"
                    value={lesson.duration_seconds || 0}
                    onChange={(e) =>
                      setLesson({ ...lesson, duration_seconds: parseInt(e.target.value) || 0 })
                    }
                    placeholder="Se detecta automaticamente"
                  />
                  <p className="text-xs text-muted-foreground">
                    {lesson.duration_seconds ? formatDuration(lesson.duration_seconds) : "No configurada"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>URL del Video (avanzado)</Label>
                  <Input
                    value={lesson.video_url || ""}
                    onChange={(e) => setLesson({ ...lesson, video_url: e.target.value || null })}
                    placeholder="https://..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Solo modificar si sabes lo que haces
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Materiales Complementarios</CardTitle>
              <CardDescription>
                Agrega archivos descargables, enlaces o recursos adicionales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-2">No hay recursos todavia</h3>
                <p className="text-sm text-muted-foreground">
                  Disponible en una proxima version
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuracion de Acceso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="free">Leccion Gratuita</Label>
                  <p className="text-sm text-muted-foreground">
                    Permite acceso sin inscripcion (preview del contenido)
                  </p>
                </div>
                <Switch
                  id="free"
                  checked={lesson.is_free}
                  onCheckedChange={(checked) => setLesson({ ...lesson, is_free: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="published">Publicar Leccion</Label>
                  <p className="text-sm text-muted-foreground">
                    Hacer visible esta leccion a los estudiantes
                  </p>
                </div>
                <Switch
                  id="published"
                  checked={lesson.is_published}
                  onCheckedChange={(checked) => setLesson({ ...lesson, is_published: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recompensas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Star className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">XP por completar</p>
                  <p className="text-sm text-muted-foreground">
                    Puntos que recibe el estudiante al completar esta leccion
                  </p>
                </div>
                <Input
                  type="number"
                  value={lesson.xp_reward ?? 25}
                  onChange={(e) =>
                    setLesson({ ...lesson, xp_reward: parseInt(e.target.value) || 0 })
                  }
                  className="w-24"
                />
              </div>
            </CardContent>
          </Card>

          {!isNew && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" disabled>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar Leccion
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Disponible pronto. Por ahora usa Supabase directamente.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
