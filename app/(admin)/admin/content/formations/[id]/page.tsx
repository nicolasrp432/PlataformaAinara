"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Eye, Trash2, Plus, GripVertical, MoreVertical, Video, FileText, Clock, Users, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { createClient } from "@/lib/supabase/client"

interface Formation {
  id: string
  title: string
  slug: string
  description: string | null
  long_description: string | null
  thumbnail_url: string | null
  difficulty: string
  duration_hours: number
  is_published: boolean
  is_premium: boolean
  is_featured: boolean
  xp_reward: number
  price: number
  order_index: number
}

interface Module {
  id: string
  formation_id: string
  title: string
  description: string | null
  order_index: number
  is_published: boolean
  lessons?: Lesson[]
}

interface Lesson {
  id: string
  module_id: string
  title: string
  description: string | null
  video_url: string | null
  video_duration: number
  lesson_type: string
  order_index: number
  is_published: boolean
  is_preview: boolean
  xp_reward: number
}

const difficultyLevels = [
  { value: "beginner", label: "Principiante" },
  { value: "intermediate", label: "Intermedio" },
  { value: "advanced", label: "Avanzado" },
]

export default function FormationEditorPage() {
  const params = useParams()
  const router = useRouter()
  const isNew = params?.id === "new"
  const supabase = createClient()
  
  const [formation, setFormation] = useState<Formation | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  
  // Dialogs
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false)
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false)
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  
  // Form state for new module/lesson
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
        long_description: "",
        thumbnail_url: "",
        difficulty: "beginner",
        duration_hours: 0,
        is_published: false,
        is_premium: true,
        is_featured: false,
        xp_reward: 100,
        price: 0,
        order_index: 0,
      })
      setLoading(false)
    } else {
      loadFormation()
    }
  }, [isNew, params?.id])

  async function loadFormation() {
    try {
      // Load formation
      const { data: formationData, error: formationError } = await supabase
        .from("formations")
        .select("*")
        .eq("id", params?.id)
        .single()

      if (formationError) throw formationError
      setFormation(formationData)

      // Load modules with lessons
      const { data: modulesData, error: modulesError } = await supabase
        .from("modules")
        .select(`
          *,
          lessons(*)
        `)
        .eq("formation_id", params?.id)
        .order("order_index", { ascending: true })

      if (modulesError) throw modulesError
      
      // Sort lessons within each module
      const sortedModules = (modulesData || []).map((m: any) => ({
        ...m,
        lessons: (m.lessons || []).sort((a: Lesson, b: Lesson) => a.order_index - b.order_index)
      }))
      
      setModules(sortedModules)
    } catch (error) {
      console.error("Error loading formation:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!formation) return
    
    setSaving(true)
    try {
      if (isNew) {
        // Create new formation
        const { data, error } = await supabase
          .from("formations")
          .insert({
            title: formation.title,
            slug: formation.slug,
            description: formation.description,
            long_description: formation.long_description,
            thumbnail_url: formation.thumbnail_url,
            difficulty: formation.difficulty,
            duration_hours: formation.duration_hours,
            is_published: formation.is_published,
            is_premium: formation.is_premium,
            is_featured: formation.is_featured,
            xp_reward: formation.xp_reward,
            price: formation.price,
          })
          .select()
          .single()

        if (error) throw error
        
        router.push(`/admin/content/formations/${data.id}`)
      } else {
        // Update existing formation
        const { error } = await supabase
          .from("formations")
          .update({
            title: formation.title,
            slug: formation.slug,
            description: formation.description,
            long_description: formation.long_description,
            thumbnail_url: formation.thumbnail_url,
            difficulty: formation.difficulty,
            duration_hours: formation.duration_hours,
            is_published: formation.is_published,
            is_premium: formation.is_premium,
            is_featured: formation.is_featured,
            xp_reward: formation.xp_reward,
            price: formation.price,
          })
          .eq("id", formation.id)

        if (error) throw error
      }
    } catch (error) {
      console.error("Error saving formation:", error)
    } finally {
      setSaving(false)
    }
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

  async function addModule() {
    if (!formation || !newModuleTitle.trim() || isNew) return
    
    try {
      const moduleSlug = newModuleTitle.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString().slice(-4)
      const { data, error } = await supabase
        .from("modules")
        .insert({
          formation_id: formation.id,
          title: newModuleTitle,
          slug: moduleSlug,
          description: newModuleDescription || null,
          order_index: modules.length,
          is_published: false,
        })
        .select()
        .single()

      if (error) throw error

      setModules([...modules, { ...data, lessons: [] }])
      setNewModuleTitle("")
      setNewModuleDescription("")
      setModuleDialogOpen(false)
    } catch (error) {
      console.error("Error creating module:", error)
    }
  }

  async function addLesson() {
    if (!selectedModuleId || !newLessonTitle.trim()) return
    
    const moduleIndex = modules.findIndex(m => m.id === selectedModuleId)
    if (moduleIndex === -1) return
    
    try {
      const lessonSlug = newLessonTitle.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString().slice(-4)
      const { data, error } = await supabase
        .from("lessons")
        .insert({
          module_id: selectedModuleId,
          title: newLessonTitle,
          slug: lessonSlug,
          description: newLessonDescription || null,
          order_index: modules[moduleIndex].lessons?.length || 0,
          lesson_type: "video",
          is_published: false,
          is_preview: false,
          xp_reward: 25,
        })
        .select()
        .single()

      if (error) throw error

      const updatedModules = [...modules]
      updatedModules[moduleIndex] = {
        ...updatedModules[moduleIndex],
        lessons: [...(updatedModules[moduleIndex].lessons || []), data]
      }
      setModules(updatedModules)
      
      setNewLessonTitle("")
      setNewLessonDescription("")
      setLessonDialogOpen(false)
    } catch (error) {
      console.error("Error creating lesson:", error)
    }
  }

  async function deleteModule(moduleId: string) {
    try {
      const { error } = await supabase
        .from("modules")
        .delete()
        .eq("id", moduleId)

      if (error) throw error

      setModules(modules.filter(m => m.id !== moduleId))
    } catch (error) {
      console.error("Error deleting module:", error)
    }
  }

  async function deleteLesson(lessonId: string, moduleId: string) {
    try {
      const { error } = await supabase
        .from("lessons")
        .delete()
        .eq("id", lessonId)

      if (error) throw error

      const moduleIndex = modules.findIndex(m => m.id === moduleId)
      if (moduleIndex !== -1) {
        const updatedModules = [...modules]
        updatedModules[moduleIndex] = {
          ...updatedModules[moduleIndex],
          lessons: updatedModules[moduleIndex].lessons?.filter(l => l.id !== lessonId) || []
        }
        setModules(updatedModules)
      }
    } catch (error) {
      console.error("Error deleting lesson:", error)
    }
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!formation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Formacion no encontrada</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Volver
        </Button>
      </div>
    )
  }

  const totalLessons = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0)
  const totalDuration = modules.reduce(
    (acc, m) => acc + (m.lessons?.reduce((acc2, l) => acc2 + (l.video_duration || 0), 0) || 0),
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
            <Button variant="outline" size="sm" asChild>
              <Link href={`/formations/${formation.slug}`} target="_blank">
                <Eye className="h-4 w-4 mr-2" />
                Vista Previa
              </Link>
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
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
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Clock className="h-4 w-4 text-amber-600" />
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
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Modulos</p>
                  <p className="text-xl font-semibold">{modules.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Users className="h-4 w-4 text-green-600" />
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
          <TabsTrigger value="content" disabled={isNew}>Contenido</TabsTrigger>
          <TabsTrigger value="settings">Configuracion</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informacion Basica</CardTitle>
              <CardDescription>
                Configura el titulo, descripcion y nivel de la formacion
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
                <Label htmlFor="description">Descripcion corta</Label>
                <Textarea
                  id="description"
                  value={formation.description || ""}
                  onChange={(e) =>
                    setFormation({ ...formation, description: e.target.value })
                  }
                  placeholder="Breve descripcion de la formacion..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="long_description">Descripcion completa</Label>
                <Textarea
                  id="long_description"
                  value={formation.long_description || ""}
                  onChange={(e) =>
                    setFormation({ ...formation, long_description: e.target.value })
                  }
                  placeholder="Descripcion detallada de lo que aprenderan..."
                  rows={5}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Nivel</Label>
                  <Select
                    value={formation.difficulty}
                    onValueChange={(value) =>
                      setFormation({ ...formation, difficulty: value })
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
                <div className="space-y-2">
                  <Label htmlFor="duration">Duracion (horas)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min={0}
                    value={formation.duration_hours}
                    onChange={(e) =>
                      setFormation({ ...formation, duration_hours: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="xp_reward">XP Recompensa</Label>
                  <Input
                    id="xp_reward"
                    type="number"
                    min={0}
                    value={formation.xp_reward}
                    onChange={(e) =>
                      setFormation({ ...formation, xp_reward: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Imagen de Portada</CardTitle>
              <CardDescription>
                URL de la imagen de portada (recomendado: 1280x720px)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  value={formation.thumbnail_url || ""}
                  onChange={(e) =>
                    setFormation({ ...formation, thumbnail_url: e.target.value })
                  }
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
                {formation.thumbnail_url && (
                  <div className="border rounded-lg overflow-hidden">
                    <img
                      src={formation.thumbnail_url}
                      alt="Portada"
                      className="w-full max-h-48 object-cover"
                    />
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
                      placeholder="Describe el contenido de este modulo..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setModuleDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={addModule} disabled={!newModuleTitle.trim()}>
                    Crear Modulo
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Modules List */}
          <div className="space-y-4">
            {modules.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 font-semibold">No hay modulos</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Agrega un modulo para empezar a crear contenido
                  </p>
                </CardContent>
              </Card>
            ) : (
              modules.map((module, moduleIndex) => (
                <Card key={module.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                          {moduleIndex + 1}
                        </div>
                        <div>
                          <CardTitle className="text-base">{module.title}</CardTitle>
                          {module.description && (
                            <CardDescription className="text-xs mt-1">
                              {module.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={module.is_published ? "default" : "outline"}>
                          {module.is_published ? "Publicado" : "Borrador"}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedModuleId(module.id)
                                setLessonDialogOpen(true)
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Agregar Leccion
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deleteModule(module.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar Modulo
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Lessons List */}
                    {module.lessons && module.lessons.length > 0 ? (
                      <div className="space-y-2">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <div
                            key={lesson.id}
                            className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                          >
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                            <div className="flex items-center justify-center w-6 h-6 rounded bg-muted text-muted-foreground text-xs font-medium">
                              {lessonIndex + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{lesson.title}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="capitalize">{lesson.lesson_type}</span>
                                {lesson.video_duration > 0 && (
                                  <>
                                    <span>-</span>
                                    <span>{formatDuration(lesson.video_duration)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {lesson.is_preview && (
                                <Badge variant="secondary" className="text-xs">Preview</Badge>
                              )}
                              <Badge variant={lesson.is_published ? "default" : "outline"} className="text-xs">
                                {lesson.is_published ? "Publicado" : "Borrador"}
                              </Badge>
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={`/admin/content/lessons/${lesson.id}`}>
                                  <Video className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => deleteLesson(lesson.id, module.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground text-sm">
                        No hay lecciones en este modulo
                        <Button
                          variant="link"
                          className="ml-1 p-0 h-auto"
                          onClick={() => {
                            setSelectedModuleId(module.id)
                            setLessonDialogOpen(true)
                          }}
                        >
                          Agregar una
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Lesson Dialog */}
          <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Leccion</DialogTitle>
                <DialogDescription>
                  Crea una nueva leccion para este modulo
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="lesson-title">Titulo de la Leccion</Label>
                  <Input
                    id="lesson-title"
                    value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)}
                    placeholder="Ej: Introduccion a la Meditacion"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lesson-description">Descripcion</Label>
                  <Textarea
                    id="lesson-description"
                    value={newLessonDescription}
                    onChange={(e) => setNewLessonDescription(e.target.value)}
                    placeholder="Describe el contenido de esta leccion..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setLessonDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={addLesson} disabled={!newLessonTitle.trim()}>
                  Crear Leccion
                </Button>
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
                Configura quien puede acceder a esta formacion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Formacion Premium</Label>
                  <p className="text-sm text-muted-foreground">
                    Solo usuarios con suscripcion pueden acceder
                  </p>
                </div>
                <Switch
                  checked={formation.is_premium}
                  onCheckedChange={(checked) =>
                    setFormation({ ...formation, is_premium: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Destacada</Label>
                  <p className="text-sm text-muted-foreground">
                    Mostrar en la seccion destacada de la plataforma
                  </p>
                </div>
                <Switch
                  checked={formation.is_featured}
                  onCheckedChange={(checked) =>
                    setFormation({ ...formation, is_featured: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Publicada</Label>
                  <p className="text-sm text-muted-foreground">
                    Hacer visible para los estudiantes
                  </p>
                </div>
                <Switch
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
              <CardTitle>Precio</CardTitle>
              <CardDescription>
                Configura el precio si se vende individualmente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="price">Precio (USD)</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step={0.01}
                  value={formation.price}
                  onChange={(e) =>
                    setFormation({ ...formation, price: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  Deja en 0 si solo esta disponible con suscripcion
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
