import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Formation } from "@/types"

export const metadata: Metadata = {
  title: "Formaciones",
  description: "Gestiona las formaciones de la plataforma",
}

// Mock data - will be fetched from API
const mockFormations: Formation[] = [
  {
    id: "1",
    title: "Fundamentos del Autoconocimiento",
    slug: "fundamentos-autoconocimiento",
    description: "Un viaje profundo hacia el entendimiento de ti mismo.",
    short_description: "Descubre quien eres realmente",
    level: "beginner",
    duration_minutes: 480,
    is_premium: true,
    is_published: true,
    sort_order: 1,
    modules_count: 4,
    lessons_count: 20,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-03-10T14:30:00Z",
  },
  {
    id: "2",
    title: "Meditacion y Mindfulness",
    slug: "meditacion-mindfulness",
    description: "Tecnicas de meditacion para la vida moderna.",
    short_description: "Encuentra la paz interior",
    level: "beginner",
    duration_minutes: 360,
    is_premium: true,
    is_published: true,
    sort_order: 2,
    modules_count: 3,
    lessons_count: 15,
    created_at: "2024-02-01T09:00:00Z",
    updated_at: "2024-03-15T11:00:00Z",
  },
  {
    id: "3",
    title: "Liderazgo Consciente",
    slug: "liderazgo-consciente",
    description: "Desarrolla habilidades de liderazgo desde la consciencia.",
    short_description: "Lidera desde el corazon",
    level: "intermediate",
    duration_minutes: 600,
    is_premium: true,
    is_published: false,
    sort_order: 3,
    modules_count: 5,
    lessons_count: 25,
    created_at: "2024-03-01T08:00:00Z",
    updated_at: "2024-03-20T16:00:00Z",
  },
]

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

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return `${hours}h ${mins > 0 ? `${mins}m` : ""}`
  }
  return `${mins}m`
}

export default function FormationsPage() {
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
              />
            </div>
            <div className="flex gap-2">
              <Select defaultValue="all">
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
              <Select defaultValue="all">
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

      {/* Formations List */}
      <div className="grid gap-4">
        {mockFormations.map((formation) => (
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
                            <Badge variant="success" className="text-xs">Publicado</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Borrador</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formation.short_description}
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
                              Ver detalles
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/content/formations/${formation.id}/edit`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/content/formations/${formation.id}/modules`}>
                              <FolderOpen className="mr-2 h-4 w-4" />
                              Gestionar modulos
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {getLevelBadge(formation.level)}
                    <div className="flex items-center gap-1">
                      <FolderOpen className="h-4 w-4" />
                      {formation.modules_count} modulos
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {formation.lessons_count} lecciones
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDuration(formation.duration_minutes)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {mockFormations.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 font-semibold">No hay formaciones</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Crea tu primera formacion para empezar
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
    </div>
  )
}
