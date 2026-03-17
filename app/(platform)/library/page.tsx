"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { 
  Search, 
  Filter, 
  Clock, 
  Star, 
  Users, 
  Play,
  BookOpen,
  Sparkles,
  Lock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

// Mock data
const formations = [
  {
    id: "1",
    title: "Despertar de la Consciencia",
    slug: "despertar-consciencia",
    description: "Un viaje profundo hacia el autoconocimiento y la transformacion interior.",
    thumbnail: "/images/formations/despertar.jpg",
    category: "consciousness",
    difficulty: "intermediate",
    duration: 480,
    lessonsCount: 12,
    studentsCount: 234,
    rating: 4.8,
    isPremium: true,
    progress: 45,
    isEnrolled: true,
  },
  {
    id: "2",
    title: "Sanacion Emocional",
    slug: "sanacion-emocional",
    description: "Herramientas practicas para sanar heridas emocionales y liberar el pasado.",
    thumbnail: "/images/formations/sanacion.jpg",
    category: "healing",
    difficulty: "beginner",
    duration: 360,
    lessonsCount: 8,
    studentsCount: 189,
    rating: 4.9,
    isPremium: true,
    progress: 0,
    isEnrolled: false,
  },
  {
    id: "3",
    title: "Meditacion Profunda",
    slug: "meditacion-profunda",
    description: "Tecnicas avanzadas de meditacion para alcanzar estados de consciencia expandida.",
    thumbnail: "/images/formations/meditacion.jpg",
    category: "meditation",
    difficulty: "advanced",
    duration: 600,
    lessonsCount: 15,
    studentsCount: 156,
    rating: 4.7,
    isPremium: true,
    progress: 100,
    isEnrolled: true,
  },
  {
    id: "4",
    title: "Introduccion al Camino Interior",
    slug: "introduccion-camino",
    description: "Los primeros pasos en tu viaje de desarrollo personal y espiritual.",
    thumbnail: "/images/formations/intro.jpg",
    category: "spirituality",
    difficulty: "beginner",
    duration: 180,
    lessonsCount: 6,
    studentsCount: 412,
    rating: 4.6,
    isPremium: false,
    progress: 0,
    isEnrolled: false,
  },
  {
    id: "5",
    title: "El Arte de las Relaciones",
    slug: "arte-relaciones",
    description: "Transforma tus relaciones desde el amor consciente y la comunicacion autentica.",
    thumbnail: "/images/formations/relaciones.jpg",
    category: "relationships",
    difficulty: "intermediate",
    duration: 420,
    lessonsCount: 10,
    studentsCount: 98,
    rating: 4.8,
    isPremium: true,
    progress: 20,
    isEnrolled: true,
  },
]

const categories = [
  { value: "all", label: "Todas las categorias" },
  { value: "consciousness", label: "Consciencia" },
  { value: "healing", label: "Sanacion" },
  { value: "meditation", label: "Meditacion" },
  { value: "spirituality", label: "Espiritualidad" },
  { value: "relationships", label: "Relaciones" },
]

const difficulties = [
  { value: "all", label: "Todos los niveles" },
  { value: "beginner", label: "Principiante" },
  { value: "intermediate", label: "Intermedio" },
  { value: "advanced", label: "Avanzado" },
]

const difficultyColors = {
  beginner: "bg-green-500/10 text-green-600",
  intermediate: "bg-yellow-500/10 text-yellow-600",
  advanced: "bg-red-500/10 text-red-600",
}

const difficultyLabels = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
}

export default function LibraryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [category, setCategory] = useState("all")
  const [difficulty, setDifficulty] = useState("all")
  const [view, setView] = useState<"all" | "enrolled" | "completed">("all")

  const filteredFormations = formations.filter((f) => {
    const matchesSearch = f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = category === "all" || f.category === category
    const matchesDifficulty = difficulty === "all" || f.difficulty === difficulty
    const matchesView = view === "all" || 
      (view === "enrolled" && f.isEnrolled) ||
      (view === "completed" && f.progress === 100)
    
    return matchesSearch && matchesCategory && matchesDifficulty && matchesView
  })

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ""}`
    }
    return `${mins}m`
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Biblioteca de Formaciones</h1>
        <p className="text-muted-foreground mt-1">
          Explora nuestras formaciones y comienza tu viaje de transformacion
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={view === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("all")}
          >
            Todas
          </Button>
          <Button
            variant={view === "enrolled" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("enrolled")}
          >
            En Progreso
          </Button>
          <Button
            variant={view === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("completed")}
          >
            Completadas
          </Button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar formaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Nivel" />
            </SelectTrigger>
            <SelectContent>
              {difficulties.map((diff) => (
                <SelectItem key={diff.value} value={diff.value}>
                  {diff.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Formations Grid */}
      {filteredFormations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No se encontraron formaciones</h3>
            <p className="text-muted-foreground">
              Intenta con otros filtros o terminos de busqueda
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFormations.map((formation) => (
            <Link
              key={formation.id}
              href={`/formations/${formation.slug}`}
              className="group"
            >
              <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow">
                {/* Thumbnail */}
                <div className="relative aspect-video bg-muted">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <Sparkles className="h-12 w-12 text-primary/40" />
                  </div>
                  
                  {/* Progress Overlay */}
                  {formation.isEnrolled && formation.progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-3 py-2">
                      <div className="flex items-center justify-between text-white text-xs mb-1">
                        <span>Progreso</span>
                        <span>{formation.progress}%</span>
                      </div>
                      <Progress value={formation.progress} className="h-1" />
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {formation.isPremium && (
                      <Badge className="bg-secondary text-secondary-foreground">
                        Premium
                      </Badge>
                    )}
                    {formation.progress === 100 && (
                      <Badge className="bg-green-500 text-white">
                        Completado
                      </Badge>
                    )}
                  </div>

                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                      {formation.isPremium && !formation.isEnrolled ? (
                        <Lock className="h-6 w-6 text-muted-foreground" />
                      ) : (
                        <Play className="h-6 w-6 text-primary ml-1" />
                      )}
                    </div>
                  </div>
                </div>

                <CardContent className="p-5">
                  {/* Category & Difficulty */}
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-xs">
                      {categories.find((c) => c.value === formation.category)?.label}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs",
                        difficultyColors[formation.difficulty as keyof typeof difficultyColors]
                      )}
                    >
                      {difficultyLabels[formation.difficulty as keyof typeof difficultyLabels]}
                    </Badge>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
                    {formation.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {formation.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDuration(formation.duration)}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {formation.lessonsCount} lecciones
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-foreground">
                        {formation.rating}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
