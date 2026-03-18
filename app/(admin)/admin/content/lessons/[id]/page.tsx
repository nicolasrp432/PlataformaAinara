"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Trash2, 
  Upload, 
  Video, 
  FileText, 
  Clock, 
  Star,
  Play,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import type { Lesson as BaseLesson } from "@/types"

type Lesson = BaseLesson & {
  video_duration?: number;
  xp_reward?: number;
  is_free?: boolean;
  order_index?: number;
}

// Mock data
const mockLesson = {
  id: "l1",
  module_id: "m1",
  title: "Que es la consciencia",
  description: "Una introduccion al concepto de consciencia desde diferentes perspectivas filosoficas, cientificas y espirituales. Exploraremos las distintas definiciones y como cada una aporta una vision unica.",
  video_url: "https://customer-xxx.cloudflarestream.com/video-id/manifest/video.m3u8",
  video_duration: 900,
  content_type: "video",
  order_index: 1,
  xp_reward: 25,
  is_free: true,
  is_published: true,
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-15T10:00:00Z",
  module_title: "Fundamentos de la Consciencia",
  formation_title: "Despertar de la Consciencia",
  formation_id: "1",
} as unknown as Lesson & { module_title: string; formation_title: string; formation_id: string }

interface VideoUploadState {
  status: "idle" | "uploading" | "processing" | "ready" | "error"
  progress: number
  error?: string
}

export default function LessonEditorPage() {
  const params = useParams()
  const router = useRouter()
  const isNew = params?.id === "new"
  
  const [lesson, setLesson] = useState<typeof mockLesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [videoUpload, setVideoUpload] = useState<VideoUploadState>({
    status: "idle",
    progress: 0,
  })

  useEffect(() => {
    if (isNew) {
      setLesson({
        id: "",
        module_id: "",
        title: "",
        description: "",
        video_url: undefined,
        video_duration: 0,
        content_type: "video",
        order_index: 0,
        xp_reward: 25,
        is_free: false,
        is_published: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        module_title: "",
        formation_title: "",
        formation_id: "",
      } as unknown as typeof mockLesson)
      setLoading(false)
    } else {
      setTimeout(() => {
        setLesson(mockLesson)
        setLoading(false)
      }, 500)
    }
  }, [isNew, params?.id])

  const handleSave = async () => {
    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setSaving(false)
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setVideoUpload({ status: "uploading", progress: 0 })

    // Simulate upload progress
    const interval = setInterval(() => {
      setVideoUpload((prev) => {
        if (prev.progress >= 100) {
          clearInterval(interval)
          return { status: "processing", progress: 100 }
        }
        return { ...prev, progress: prev.progress + 10 }
      })
    }, 500)

    // Simulate processing
    setTimeout(() => {
      setVideoUpload({ status: "ready", progress: 100 })
      if (lesson) {
        setLesson({
          ...lesson,
          video_url: "https://customer-xxx.cloudflarestream.com/new-video/manifest/video.m3u8",
          video_duration: 600,
        })
      }
    }, 7000)
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
    return <div>Leccion no encontrada</div>
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
              <span>/</span>
              <span>{lesson.module_title}</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {isNew ? "Nueva Leccion" : lesson.title}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && lesson.video_url && (
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Vista Previa
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

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
              <CardDescription>
                Configura el titulo y descripcion de esta leccion
              </CardDescription>
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
                      setLesson({ ...lesson, content_type: value as Lesson["content_type"] })
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
                          Texto/Articulo
                        </div>
                      </SelectItem>
                      <SelectItem value="audio">
                        <div className="flex items-center gap-2">
                          <Play className="h-4 w-4" />
                          Audio
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
                    value={lesson.xp_reward}
                    onChange={(e) =>
                      setLesson({ ...lesson, xp_reward: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Video Tab */}
        <TabsContent value="video" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Video de la Leccion</CardTitle>
              <CardDescription>
                Sube el video para esta leccion. Formatos soportados: MP4, MOV, WebM
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lesson.video_url && videoUpload.status !== "uploading" && videoUpload.status !== "processing" ? (
                <div className="space-y-4">
                  {/* Video Preview */}
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                          <Play className="h-8 w-8" />
                        </div>
                        <p className="text-sm opacity-80">Video cargado correctamente</p>
                        <p className="text-xs opacity-60 mt-1">
                          Duracion: {formatDuration(lesson.video_duration || 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Video Info */}
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Video listo</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDuration(lesson.video_duration || 0)} de duracion
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        Previsualizar
                      </Button>
                      <Button variant="outline" size="sm">
                        Reemplazar
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Upload Area */}
                  {videoUpload.status === "idle" && (
                    <label className="block border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        className="hidden"
                      />
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Subir Video</h3>
                      <p className="text-muted-foreground mb-4">
                        Arrastra tu video aqui o haz click para seleccionar
                      </p>
                      <p className="text-sm text-muted-foreground">
                        MP4, MOV o WebM hasta 5GB
                      </p>
                    </label>
                  )}

                  {/* Uploading State */}
                  {videoUpload.status === "uploading" && (
                    <div className="border rounded-lg p-8">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <Upload className="h-6 w-6 text-primary animate-pulse" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Subiendo video...</p>
                          <p className="text-sm text-muted-foreground">
                            Por favor no cierres esta ventana
                          </p>
                        </div>
                        <span className="text-lg font-semibold">{videoUpload.progress}%</span>
                      </div>
                      <Progress value={videoUpload.progress} className="h-2" />
                    </div>
                  )}

                  {/* Processing State */}
                  {videoUpload.status === "processing" && (
                    <div className="border rounded-lg p-8">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-secondary/10">
                          <Video className="h-6 w-6 text-secondary animate-pulse" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">Procesando video...</p>
                          <p className="text-sm text-muted-foreground">
                            Generando versiones optimizadas para diferentes dispositivos
                          </p>
                        </div>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {videoUpload.status === "error" && (
                    <div className="border border-destructive rounded-lg p-8">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-destructive/10">
                          <AlertCircle className="h-6 w-6 text-destructive" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-destructive">Error al subir</p>
                          <p className="text-sm text-muted-foreground">
                            {videoUpload.error || "Ha ocurrido un error. Por favor intenta de nuevo."}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setVideoUpload({ status: "idle", progress: 0 })}
                        >
                          Reintentar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
                  <Label>Duracion Manual (segundos)</Label>
                  <Input
                    type="number"
                    value={lesson.video_duration || 0}
                    onChange={(e) =>
                      setLesson({ ...lesson, video_duration: parseInt(e.target.value) || 0 })
                    }
                    placeholder="Se detecta automaticamente"
                  />
                  <p className="text-xs text-muted-foreground">
                    Normalmente se detecta automaticamente al subir el video
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>URL del Video (avanzado)</Label>
                  <Input
                    value={lesson.video_url || ""}
                    onChange={(e) => setLesson({ ...lesson, video_url: e.target.value })}
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
                Agrega archivos descargables, enlaces o recursos adicionales para esta leccion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-2">No hay recursos todavia</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Agrega PDFs, hojas de trabajo o enlaces utiles
                </p>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Recurso
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contenido de Texto</CardTitle>
              <CardDescription>
                Agrega notas, transcripcion o contenido escrito complementario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Escribe contenido adicional aqui... Puedes usar Markdown para formato."
                rows={10}
              />
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
                    Permite acceso sin suscripcion (preview del contenido)
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
            <CardContent className="space-y-4">
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
                  value={lesson.xp_reward}
                  onChange={(e) =>
                    setLesson({ ...lesson, xp_reward: parseInt(e.target.value) || 0 })
                  }
                  className="w-24"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Leccion
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
