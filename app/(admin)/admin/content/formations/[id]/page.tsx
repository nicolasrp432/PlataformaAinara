"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Save, Eye, Trash2, Plus, GripVertical, MoreVertical, Video, FileText, Clock, Users } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Formation, Module, Lesson } from "@/types"

// Mock data for development
const mockFormation: Formation & { modules: (Module & { lessons: Lesson[] })[] } = {
  id: "1",
  title: "Despertar de la Consciencia",
  slug: "despertar-consciencia",
  description: "Un viaje profundo hacia el autoconocimiento y la transformacion interior. Descubre las claves para despertar tu consciencia y vivir con mayor plenitud.",
  thumbnail_url: "/images/formations/despertar.jpg",
  category: "consciousness",
  difficulty_level: "intermediate",
  estimated_duration: 480,
  xp_reward: 500,
  is_premium: true,
  is_published: true,
  order_index: 1,
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-01-20T15:30:00Z",
  modules: [
    {
      id: "m1",
      formation_id: "1",
      title: "Fundamentos de la Consciencia",
      description: "Comprender los principios basicos de la consciencia y como influye en nuestra vida diaria.",
      order_index: 1,
      is_published: true,
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-01-15T10:00:00Z",
      lessons: [
        {
          id: "l1",
          module_id: "m1",
          title: "Que es la consciencia",
          description: "Una introduccion al concepto de consciencia desde diferentes perspectivas.",
          video_url: "https://stream.cloudflare.com/xxx",
          video_duration: 900,
          content_type: "video",
          order_index: 1,
          xp_reward: 25,
          is_free: true,
          is_published: true,
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-15T10:00:00Z",
        },
        {
          id: "l2",
          module_id: "m1",
          title: "Niveles de consciencia",
          description: "Explorando los diferentes niveles de consciencia segun diversas tradiciones.",
          video_url: "https://stream.cloudflare.com/yyy",
          video_duration: 1200,
          content_type: "video",
          order_index: 2,
          xp_reward: 30,
          is_free: false,
          is_published: true,
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-15T10:00:00Z",
        },
      ],
    },
    {
      id: "m2",
      formation_id: "1",
      title: "Practicas de Despertar",
      description: "Tecnicas y ejercicios para expandir tu consciencia.",
      order_index: 2,
      is_published: true,
      created_at: "2024-01-16T10:00:00Z",
      updated_at: "2024-01-16T10:00:00Z",
      lessons: [
        {
          id: "l3",
          module_id: "m2",
          title: "Meditacion guiada",
          description: "Una meditacion guiada para conectar con tu esencia.",
          video_url: "https://stream.cloudflare.com/zzz",
          video_duration: 1800,
          content_type: "video",
          order_index: 1,
          xp_reward: 40,
          is_free: false,
          is_published: true,
          created_at: "2024-01-16T10:00:00Z",
          updated_at: "2024-01-16T10:00:00Z",
        },
      ],
    },
  ],
}

const categories = [
  { value: "consciousness", label: "Consciencia" },
  { value: "spirituality", label: "Espiritualidad" },
  { value: "meditation", label: "Meditacion" },
  { value: "personal_growth", label: "Crecimiento Personal" },
  { value: "relationships", label: "Relaciones" },
  { value: "health", label: "Salud y Bienestar" },
]

const difficultyLevels = [
  { value: "beginner", label: "Principiante" },
  { value: "intermediate", label: "Intermedio" },
  { value: "advanced", label: "Avanzado" },
]

export default function FormationEditorPage() {
  const params = useParams()
  const router = useRouter()
  const isNew = params.id === "new"
  
  const [formation, setFormation] = useState<typeof mockFormation | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false)
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false)
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const [newModuleTitle, setNewModuleTitle] = useState("")
  const [newModuleDescription, setNewModuleDescription] = useState("")
  const [newLessonTitle, setNewLessonTitle] = useState("")
  const [newLessonDescription, setNewLessonDescription] = useState("")

  useEffect(() => {
    if (isNew) {
      setFormation({
        id: "",
        title: "",
        slug: "",
        description: "",
        thumbnail_url: "",
        category: "consciousness",
        difficulty_level: "beginner",
        estimated_duration: 0,
        xp_reward: 100,
        is_premium: false,
        is_published: false,
        order_index: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        modules: [],
      })
      setLoading(false)
    } else {
      // Simulate API call
      setTimeout(() => {
        setFormation(mockFormation)
        setLoading(false)
      }, 500)
    }
  }, [isNew, params.id])

  const handleSave = async () => {
    setSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setSaving(false)
    // Show success toast
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  const handleTitleChange = (title: string) => {
    if (formation) {
      setFormation({
        ...formation,
        title,
        slug: isNew ? generateSlug(title) : formation.slug,
      })
    }
  }

  const addModule = () => {
    if (!formation || !newModuleTitle.trim()) return
    
    const newModule: Module & { lessons: Lesson[] } = {
      id: `temp-${Date.now()}`,
      formation_id: formation.id,
      title: newModuleTitle,
      description: newModuleDescription,
      order_index: formation.modules.length + 1,
      is_published: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      lessons: [],
    }
    
    setFormation({
      ...formation,
      modules: [...formation.modules, newModule],
    })
    
    setNewModuleTitle("")
    setNewModuleDescription("")
    setModuleDialogOpen(false)
  }

  const addLesson = () => {
    if (!formation || !selectedModuleId || !newLessonTitle.trim()) return
    
    const moduleIndex = formation.modules.findIndex((m) => m.id === selectedModuleId)
    if (moduleIndex === -1) return
    
    const newLesson: Lesson = {
      id: `temp-${Date.now()}`,
      module_id: selectedModuleId,
      title: newLessonTitle,
      description: newLessonDescription,
      video_url: null,
      video_duration: 0,
      content_type: "video",
      order_index: formation.modules[moduleIndex].lessons.length + 1,
      xp_reward: 25,
      is_free: false,
      is_published: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    const updatedModules = [...formation.modules]
    updatedModules[moduleIndex] = {
      ...updatedModules[moduleIndex],
      lessons: [...updatedModules[moduleIndex].lessons, newLesson],
    }
    
    setFormation({
      ...formation,
      modules: updatedModules,
    })
    
    setNewLessonTitle("")
    setNewLessonDescription("")
    setLessonDialogOpen(false)
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!formation) {
    return <div>Formacion no encontrada</div>
  }

  const totalLessons = formation.modules.reduce((acc, m) => acc + m.lessons.length, 0)
  const totalDuration = formation.modules.reduce(
    (acc, m) => acc + m.lessons.reduce((acc2, l) => acc2 + (l.video_duration || 0), 0),
    0
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isNew ? "Nueva Formacion" : "Editar Formacion"}
            </h1>
            <p className="text-muted-foreground">
              {isNew ? "Crea una nueva formacion para tus estudiantes" : formation.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
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

      {/* Stats Bar */}
      {!isNew && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Video className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lecciones</p>
                  <p className="text-xl font-semibold">{totalLessons}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-secondary/10">
                  <Clock className="h-4 w-4 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duracion</p>
                  <p className="text-xl font-semibold">{formatDuration(totalDuration)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-accent/10">
                  <FileText className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Modulos</p>
                  <p className="text-xl font-semibold">{formation.modules.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estudiantes</p>
                  <p className="text-xl font-semibold">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Detalles</TabsTrigger>
          <TabsTrigger value="content">Contenido</TabsTrigger>
          <TabsTrigger value="settings">Configuracion</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informacion Basica</CardTitle>
              <CardDescription>
                Configura el titulo, descripcion y categoria de la formacion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titulo</Label>
                  <Input
                    id="title"
                    value={formation.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Ej: Despertar de la Consciencia"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL)</Label>
                  <Input
                    id="slug"
                    value={formation.slug}
                    onChange={(e) =>
                      setFormation({ ...formation, slug: e.target.value })
                    }
                    placeholder="despertar-consciencia"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripcion</Label>
                <Textarea
                  id="description"
                  value={formation.description || ""}
                  onChange={(e) =>
                    setFormation({ ...formation, description: e.target.value })
                  }
                  placeholder="Describe de que trata esta formacion..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formation.category}
                    onValueChange={(value) =>
                      setFormation({ ...formation, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Nivel de Dificultad</Label>
                  <Select
                    value={formation.difficulty_level}
                    onValueChange={(value) =>
                      setFormation({ ...formation, difficulty_level: value as Formation["difficulty_level"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona el nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      {difficultyLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Imagen de Portada</CardTitle>
              <CardDescription>
                Sube una imagen que represente la formacion (recomendado: 1280x720px)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                {formation.thumbnail_url ? (
                  <div className="relative">
                    <img
                      src={formation.thumbnail_url}
                      alt="Portada"
                      className="max-h-48 mx-auto rounded-lg"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                    >
                      Cambiar imagen
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                      <Video className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-2">
                      Arrastra una imagen aqui o haz click para seleccionar
                    </p>
                    <Button variant="outline" size="sm">
                      Subir imagen
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Modulos y Lecciones</h3>
              <p className="text-sm text-muted-foreground">
                Organiza el contenido de tu formacion en modulos
              </p>
            </div>
            <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Modulo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuevo Modulo</DialogTitle>
                  <DialogDescription>
                    Crea un nuevo modulo para organizar tus lecciones
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="module-title">Titulo del Modulo</Label>
                    <Input
                      id="module-title"
                      value={newModuleTitle}
                      onChange={(e) => setNewModuleTitle(e.target.value)}
                      placeholder="Ej: Fundamentos de la Consciencia"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="module-description">Descripcion</Label>
                    <Textarea
                      id="module-description"
                      value={newModuleDescription}
                      onChange={(e) => setNewModuleDescription(e.target.value)}
                      placeholder="Describe brevemente este modulo..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setModuleDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={addModule}>Crear Modulo</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Modules List */}
          <div className="space-y-4">
            {formation.modules.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No hay modulos todavia</h3>
                  <p className="text-muted-foreground mb-4">
                    Crea tu primer modulo para comenzar a agregar lecciones
                  </p>
                  <Button onClick={() => setModuleDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear primer modulo
                  </Button>
                </CardContent>
              </Card>
            ) : (
              formation.modules.map((module, moduleIndex) => (
                <Card key={module.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="cursor-grab p-1 hover:bg-muted rounded">
                          <GripVertical className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            <span className="text-muted-foreground">
                              Modulo {moduleIndex + 1}:
                            </span>
                            {module.title}
                            {module.is_published ? (
                              <Badge variant="default" className="ml-2">
                                Publicado
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="ml-2">
                                Borrador
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>{module.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedModuleId(module.id)
                            setLessonDialogOpen(true)
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Leccion
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Editar modulo</DropdownMenuItem>
                            <DropdownMenuItem>
                              {module.is_published ? "Despublicar" : "Publicar"}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {module.lessons.length === 0 ? (
                      <div className="py-6 text-center border-2 border-dashed border-border rounded-lg">
                        <p className="text-muted-foreground mb-2">
                          No hay lecciones en este modulo
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedModuleId(module.id)
                            setLessonDialogOpen(true)
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Agregar primera leccion
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <div
                            key={lesson.id}
                            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                          >
                            <div className="cursor-grab p-1 hover:bg-background rounded">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium">
                              {lessonIndex + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium truncate">{lesson.title}</p>
                                {lesson.is_free && (
                                  <Badge variant="outline" className="text-xs">
                                    Gratis
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Video className="h-3 w-3" />
                                  {lesson.content_type === "video" ? "Video" : "Texto"}
                                </span>
                                {lesson.video_duration > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDuration(lesson.video_duration)}
                                  </span>
                                )}
                                <span>{lesson.xp_reward} XP</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={lesson.is_published ? "default" : "secondary"}
                              >
                                {lesson.is_published ? "Publicada" : "Borrador"}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>Editar leccion</DropdownMenuItem>
                                  <DropdownMenuItem>Subir video</DropdownMenuItem>
                                  <DropdownMenuItem>
                                    {lesson.is_published ? "Despublicar" : "Publicar"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Add Lesson Dialog */}
          <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Leccion</DialogTitle>
                <DialogDescription>
                  Agrega una nueva leccion a este modulo
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="lesson-title">Titulo de la Leccion</Label>
                  <Input
                    id="lesson-title"
                    value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)}
                    placeholder="Ej: Introduccion a la meditacion"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lesson-description">Descripcion</Label>
                  <Textarea
                    id="lesson-description"
                    value={newLessonDescription}
                    onChange={(e) => setNewLessonDescription(e.target.value)}
                    placeholder="Describe brevemente esta leccion..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setLessonDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={addLesson}>Crear Leccion</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuracion de Acceso</CardTitle>
              <CardDescription>
                Define quien puede acceder a esta formacion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="premium">Contenido Premium</Label>
                  <p className="text-sm text-muted-foreground">
                    Solo usuarios con suscripcion activa pueden acceder
                  </p>
                </div>
                <Switch
                  id="premium"
                  checked={formation.is_premium}
                  onCheckedChange={(checked) =>
                    setFormation({ ...formation, is_premium: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="published">Publicar Formacion</Label>
                  <p className="text-sm text-muted-foreground">
                    Hacer visible esta formacion a los estudiantes
                  </p>
                </div>
                <Switch
                  id="published"
                  checked={formation.is_published}
                  onCheckedChange={(checked) =>
                    setFormation({ ...formation, is_published: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recompensas</CardTitle>
              <CardDescription>
                Configura las recompensas por completar esta formacion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="xp">XP al completar</Label>
                <Input
                  id="xp"
                  type="number"
                  value={formation.xp_reward}
                  onChange={(e) =>
                    setFormation({
                      ...formation,
                      xp_reward: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Puntos de experiencia que recibira el estudiante al completar la formacion
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Zona de Peligro</CardTitle>
              <CardDescription>
                Acciones irreversibles para esta formacion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Formacion
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
