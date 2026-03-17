"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Video, 
  FileText,
  ArrowUpDown,
  Eye,
  Trash2,
  GripVertical
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
import type { Formation, Module, Lesson } from "@/types"

// Mock data
const mockFormations: (Formation & { modules: (Module & { lessons: Lesson[] })[] })[] = [
  {
    id: "1",
    title: "Despertar de la Consciencia",
    slug: "despertar-consciencia",
    description: "Un viaje profundo hacia el autoconocimiento",
    thumbnail_url: null,
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
        description: "Principios basicos de la consciencia",
        order_index: 1,
        is_published: true,
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-15T10:00:00Z",
        lessons: [
          { id: "l1", module_id: "m1", title: "Que es la consciencia", description: "", video_url: "https://...", video_duration: 900, content_type: "video", order_index: 1, xp_reward: 25, is_free: true, is_published: true, created_at: "", updated_at: "" },
          { id: "l2", module_id: "m1", title: "Niveles de consciencia", description: "", video_url: "https://...", video_duration: 1200, content_type: "video", order_index: 2, xp_reward: 30, is_free: false, is_published: true, created_at: "", updated_at: "" },
        ],
      },
      {
        id: "m2",
        formation_id: "1",
        title: "Practicas de Despertar",
        description: "Tecnicas y ejercicios",
        order_index: 2,
        is_published: false,
        created_at: "2024-01-16T10:00:00Z",
        updated_at: "2024-01-16T10:00:00Z",
        lessons: [
          { id: "l3", module_id: "m2", title: "Meditacion guiada", description: "", video_url: null, video_duration: 0, content_type: "video", order_index: 1, xp_reward: 40, is_free: false, is_published: false, created_at: "", updated_at: "" },
        ],
      },
    ],
  },
  {
    id: "2",
    title: "Sanacion Emocional",
    slug: "sanacion-emocional",
    description: "Herramientas para sanar heridas emocionales",
    thumbnail_url: null,
    category: "personal_growth",
    difficulty_level: "beginner",
    estimated_duration: 360,
    xp_reward: 400,
    is_premium: true,
    is_published: true,
    order_index: 2,
    created_at: "2024-02-01T10:00:00Z",
    updated_at: "2024-02-10T15:30:00Z",
    modules: [
      {
        id: "m3",
        formation_id: "2",
        title: "Reconocer las Emociones",
        description: "Identificar y nombrar emociones",
        order_index: 1,
        is_published: true,
        created_at: "2024-02-01T10:00:00Z",
        updated_at: "2024-02-01T10:00:00Z",
        lessons: [],
      },
    ],
  },
]

export default function ModulesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFormation, setSelectedFormation] = useState<string>("all")

  const filteredData = mockFormations
    .filter((f) => selectedFormation === "all" || f.id === selectedFormation)
    .map((f) => ({
      ...f,
      modules: f.modules.filter(
        (m) =>
          m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.lessons.some((l) =>
            l.title.toLowerCase().includes(searchTerm.toLowerCase())
          )
      ),
    }))
    .filter((f) => f.modules.length > 0 || searchTerm === "")

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    return `${minutes}min`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Modulos y Lecciones</h1>
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
            placeholder="Buscar modulos o lecciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedFormation} onValueChange={setSelectedFormation}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filtrar por formacion" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las formaciones</SelectItem>
            {mockFormations.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {filteredData.map((formation) => (
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
                  Ver Formacion
                </Button>
              </Link>
            </div>

            {formation.modules.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No hay modulos en esta formacion
                  </p>
                  <Link href={`/admin/content/formations/${formation.id}`}>
                    <Button variant="outline" size="sm" className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Crear primer modulo
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
                              {module.is_published ? (
                                <Badge variant="outline" className="text-xs">
                                  Publicado
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  Borrador
                                </Badge>
                              )}
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
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Vista previa
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <ArrowUpDown className="h-4 w-4 mr-2" />
                              Reordenar lecciones
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {module.lessons.length === 0 ? (
                        <div className="py-4 text-center border-2 border-dashed border-border rounded-lg">
                          <p className="text-sm text-muted-foreground mb-2">
                            Sin lecciones
                          </p>
                          <Link href={`/admin/content/lessons/new?module=${module.id}`}>
                            <Button variant="outline" size="sm">
                              <Plus className="h-4 w-4 mr-1" />
                              Agregar leccion
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
                                  {lesson.video_duration > 0 && (
                                    <span>{formatDuration(lesson.video_duration)}</span>
                                  )}
                                  <span>{lesson.xp_reward} XP</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {lesson.video_url ? (
                                  <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-200">
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
                            href={`/admin/content/lessons/new?module=${module.id}`}
                            className="flex items-center justify-center gap-2 p-2 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                            <span className="text-sm">Agregar leccion</span>
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ))}

        {filteredData.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No se encontraron resultados</h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Intenta con otros terminos de busqueda"
                  : "Crea tu primera formacion para comenzar"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
