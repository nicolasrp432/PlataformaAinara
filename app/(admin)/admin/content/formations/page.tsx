"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  FolderOpen,
  Clock,
  BookOpen,
  Loader2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { createClient } from "@/lib/supabase/client"

interface Formation {
  id: string
  title: string
  slug: string
  description: string | null
  difficulty: string
  duration_hours: number
  is_published: boolean
  is_premium: boolean
  created_at: string
  modules_count?: number
  lessons_count?: number
}

function getLevelBadge(level: string) {
  switch (level) {
    case "beginner":
      return <Badge variant="secondary">Principiante</Badge>
    case "intermediate":
      return <Badge variant="outline">Intermedio</Badge>
    case "advanced":
      return <Badge>Avanzado</Badge>
    default:
      return <Badge variant="outline">{level}</Badge>
  }
}

function formatDuration(hours: number): string {
  if (hours >= 1) {
    return `${hours}h`
  }
  return `${Math.round(hours * 60)}m`
}

export default function FormationsPage() {
  const [formations, setFormations] = useState<Formation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [levelFilter, setLevelFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadFormations()
  }, [])

  async function loadFormations() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("formations")
        .select(`
          *,
          modules:modules(count),
          lessons:modules(lessons(count))
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      const formattedData = (data || []).map((f: any) => ({
        ...f,
        modules_count: f.modules?.[0]?.count || 0,
        lessons_count: f.lessons?.reduce((acc: number, m: any) => 
          acc + (m.lessons?.[0]?.count || 0), 0) || 0
      }))

      setFormations(formattedData)
    } catch (error) {
      console.error("Error loading formations:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    
    setDeleting(true)
    try {
      const { error } = await supabase
        .from("formations")
        .delete()
        .eq("id", deleteId)

      if (error) throw error
      
      setFormations(formations.filter(f => f.id !== deleteId))
    } catch (error) {
      console.error("Error deleting formation:", error)
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const filteredFormations = formations.filter(f => {
    const matchesSearch = f.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLevel = levelFilter === "all" || f.difficulty === levelFilter
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "published" && f.is_published) ||
      (statusFilter === "draft" && !f.is_published)
    return matchesSearch && matchesLevel && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Formaciones</h1>
          <p className="text-muted-foreground">
            Gestiona las formaciones de la plataforma
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/content/formations/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Formacion
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar formaciones..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="beginner">Principiante</SelectItem>
                  <SelectItem value="intermediate">Intermedio</SelectItem>
                  <SelectItem value="advanced">Avanzado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="draft">Borrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Formations List */}
      {!loading && filteredFormations.length > 0 && (
        <div className="grid gap-4">
          {filteredFormations.map((formation) => (
            <Card key={formation.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Thumbnail placeholder */}
                  <div className="flex h-32 w-full items-center justify-center bg-muted md:h-auto md:w-48">
                    <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{formation.title}</h3>
                            {formation.is_published ? (
                              <Badge className="bg-green-500/10 text-green-600 text-xs">Publicado</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">Borrador</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {formation.description || "Sin descripcion"}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Acciones</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/content/formations/${formation.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver / Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/content/formations/${formation.id}`}>
                                <FolderOpen className="mr-2 h-4 w-4" />
                                Gestionar modulos
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => setDeleteId(formation.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {getLevelBadge(formation.difficulty)}
                      <div className="flex items-center gap-1">
                        <FolderOpen className="h-4 w-4" />
                        {formation.modules_count || 0} modulos
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {formation.lessons_count || 0} lecciones
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDuration(formation.duration_hours || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredFormations.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-semibold">No hay formaciones</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {formations.length === 0 
                ? "Crea tu primera formacion para empezar"
                : "No se encontraron formaciones con los filtros seleccionados"
              }
            </p>
            <Button className="mt-4" asChild>
              <Link href="/admin/content/formations/new">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Formacion
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar formacion</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. Se eliminaran todos los modulos, 
              lecciones y progreso de estudiantes asociados a esta formacion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
