"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Search,
  Plus,
  MoreVertical,
  Video,
  FileText,
  GripVertical,
  Eye,
  Trash2,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"

interface Lesson {
  id: string
  title: string
  content_type: string | null
  duration_seconds: number | null
  xp_reward: number | null
  is_free: boolean | null
  is_published: boolean | null
  video_url: string | null
}

interface Module {
  id: string
  formation_id: string
  title: string
  description: string | null
  sort_order: number
  is_published: boolean
  lessons: Lesson[]
}

interface Formation {
  id: string
  title: string
  is_published: boolean
  modules: Module[]
}

function formatDuration(seconds: number | null) {
  if (!seconds || seconds === 0) return null
  const minutes = Math.floor(seconds / 60)
  return `${minutes}min`
}

export default function ModulesPage() {
  const [formations, setFormations] = useState<Formation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFormation, setSelectedFormation] = useState<string>("all")

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from("formations")
        .select(`
          id, title, is_published,
          modules:modules(
            id, formation_id, title, description, sort_order, is_published,
            lessons:lessons(
              id, title, content_type, duration_seconds, xp_reward,
              is_free, is_published, video_url
            )
          )
        `)
        .order("sort_order", { ascending: true })

      if (data) {
        const normalized: Formation[] = data.map((f) => ({
          id: f.id,
          title: f.title,
          is_published: f.is_published ?? false,
          modules: ((f.modules as unknown as Module[]) ?? [])
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((m) => ({
              ...m,
              lessons: ((m.lessons as unknown as Lesson[]) ?? []),
            })),
        }))
        setFormations(normalized)
      }
      setLoading(false)
    }
    load()
  }, [])

  const filteredData = formations
    .filter((f) => selectedFormation === "all" || f.id === selectedFormation)
    .map((f) => ({
      ...f,
      modules: f.modules.filter(
        (m) =>
          !searchTerm ||
          m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.lessons.some((l) =>
            l.title.toLowerCase().includes(searchTerm.toLowerCase())
          )
      ),
    }))
    .filter((f) => f.modules.length > 0 || searchTerm === "")

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Módulos y Lecciones</h1>
          <p className="text-muted-foreground">
            Gestiona el contenido de tus formaciones
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar módulos o lecciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedFormation} onValueChange={setSelectedFormation}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filtrar por formación" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las formaciones</SelectItem>
            {formations.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {formations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No hay formaciones</h3>
              <p className="text-muted-foreground mb-4">
                Crea tu primera formación para empezar a agregar módulos
              </p>
              <Button asChild>
                <Link href="/admin/content/formations/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva formación
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredData.map((formation) => (
            <div key={formation.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">{formation.title}</h2>
                  <Badge variant={formation.is_published ? "default" : "secondary"}>
                    {formation.is_published ? "Publicada" : "Borrador"}
                  </Badge>
                </div>
                <Link href={`/admin/content/formations/${formation.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Editar formación
                  </Button>
                </Link>
              </div>

              {formation.modules.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">
                      No hay módulos en esta formación
                    </p>
                    <Link href={`/admin/content/formations/${formation.id}`}>
                      <Button variant="outline" size="sm" className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Crear primer módulo
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {formation.modules.map((module, moduleIndex) => (
                    <Card key={module.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="cursor-grab p-1 hover:bg-muted rounded">
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <CardTitle className="text-base flex items-center gap-2">
                                <span className="text-muted-foreground text-sm">
                                  M{moduleIndex + 1}
                                </span>
                                {module.title}
                                <Badge
                                  variant={module.is_published ? "outline" : "secondary"}
                                  className="text-xs"
                                >
                                  {module.is_published ? "Publicado" : "Borrador"}
                                </Badge>
                              </CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {module.lessons.length} lecciones
                              </p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/content/formations/${formation.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Editar módulo
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar (desde formación)
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {module.lessons.length === 0 ? (
                          <div className="py-4 text-center border-2 border-dashed border-border rounded-lg">
                            <p className="text-sm text-muted-foreground mb-2">Sin lecciones</p>
                            <Link href={`/admin/content/formations/${formation.id}`}>
                              <Button variant="outline" size="sm">
                                <Plus className="h-4 w-4 mr-1" />
                                Agregar lección
                              </Button>
                            </Link>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {module.lessons.map((lesson, lessonIndex) => (
                              <Link
                                key={lesson.id}
                                href={`/admin/content/lessons/${lesson.id}`}
                                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                              >
                                <div className="cursor-grab p-1">
                                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                  {lessonIndex + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-sm truncate">
                                      {lesson.title}
                                    </p>
                                    {lesson.is_free && (
                                      <Badge variant="outline" className="text-xs">
                                        Gratis
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      {lesson.content_type === "video" ? (
                                        <Video className="h-3 w-3" />
                                      ) : (
                                        <FileText className="h-3 w-3" />
                                      )}
                                      {lesson.content_type === "video" ? "Video" : "Texto"}
                                    </span>
                                    {formatDuration(lesson.duration_seconds) && (
                                      <span>{formatDuration(lesson.duration_seconds)}</span>
                                    )}
                                    {lesson.xp_reward != null && (
                                      <span>{lesson.xp_reward} XP</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {lesson.video_url ? (
                                    <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-200">
                                      Video OK
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-600 border-orange-200">
                                      Sin video
                                    </Badge>
                                  )}
                                  <Badge
                                    variant={lesson.is_published ? "default" : "secondary"}
                                    className="text-xs"
                                  >
                                    {lesson.is_published ? "Publicada" : "Borrador"}
                                  </Badge>
                                </div>
                              </Link>
                            ))}
                            <Link
                              href={`/admin/content/formations/${formation.id}`}
                              className="flex items-center justify-center gap-2 p-2 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                            >
                              <Plus className="h-4 w-4" />
                              <span className="text-sm">Agregar lección</span>
                            </Link>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))
        )}

        {filteredData.length === 0 && formations.length > 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No se encontraron resultados</h3>
              <p className="text-muted-foreground">
                Intenta con otros términos de búsqueda
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
