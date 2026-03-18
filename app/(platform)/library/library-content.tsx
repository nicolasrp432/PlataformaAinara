"use client"

import { useState } from "react"
import Link from "next/link"
import { 
  Search, 
  Clock, 
  Star, 
  Play,
  BookOpen,
  Sparkles,
  Lock,
  CheckCircle2
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

interface Formation {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnailUrl: string | null
  difficulty: string
  duration: number
  lessonsCount: number
  isPremium: boolean
  progress: number
  isEnrolled: boolean
  isCompleted: boolean
}

interface Category {
  id: string
  name: string
  slug: string
}

interface LibraryContentProps {
  formations: Formation[]
  categories: Category[]
  isLoggedIn: boolean
}

const difficulties = [
  { value: "all", label: "Todos los niveles" },
  { value: "beginner", label: "Principiante" },
  { value: "intermediate", label: "Intermedio" },
  { value: "advanced", label: "Avanzado" },
]

const difficultyColors: Record<string, string> = {
  beginner: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  intermediate: "bg-amber-500/10 text-amber-700 border-amber-200",
  advanced: "bg-rose-500/10 text-rose-700 border-rose-200",
}

const difficultyLabels: Record<string, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
}

export function LibraryContent({ formations, categories, isLoggedIn }: LibraryContentProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [difficulty, setDifficulty] = useState("all")
  const [view, setView] = useState<"all" | "enrolled" | "completed">("all")

  const filteredFormations = formations.filter((f) => {
    const matchesSearch = f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (f.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    const matchesDifficulty = difficulty === "all" || f.difficulty === difficulty
    const matchesView = view === "all" || 
      (view === "enrolled" && f.isEnrolled && !f.isCompleted) ||
      (view === "completed" && f.isCompleted)
    
    return matchesSearch && matchesDifficulty && matchesView
  })

  const formatDuration = (minutes: number) => {
    if (!minutes) return "0m"
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ""}`
    }
    return `${mins}m`
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10 relative">
      {/* Dynamic Header */}
      <div className="flex flex-col gap-2 relative z-10 mb-2">
        <h1 className="text-4xl font-light tracking-tight text-foreground sm:text-5xl">
          Biblioteca de <span className="font-semibold text-primary">Formaciones</span>
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mt-2 leading-relaxed">
          Explora conocimiento profundo, forja nuevas habilidades y comienza tu viaje de transformación definitiva.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-card/40 backdrop-blur-md p-4 rounded-2xl border border-border/50 shadow-sm">
        <div className="flex items-center gap-2">
          <Button
            variant={view === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("all")}
            className={view === "all" ? "bg-primary hover:bg-primary/90" : "border-border/50 hover:border-primary/30"}
          >
            Todas
          </Button>
          {isLoggedIn && (
            <>
              <Button
                variant={view === "enrolled" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("enrolled")}
                className={view === "enrolled" ? "bg-primary hover:bg-primary/90" : "border-border/50 hover:border-primary/30"}
              >
                En Progreso
              </Button>
              <Button
                variant={view === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("completed")}
                className={view === "completed" ? "bg-primary hover:bg-primary/90" : "border-border/50 hover:border-primary/30"}
              >
                Completadas
              </Button>
            </>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar formaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64 border-border/50 focus:border-primary/50"
            />
          </div>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="w-full sm:w-44 border-border/50">
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
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="py-16 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-medium mb-2 text-foreground">No se encontraron formaciones</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              {formations.length === 0 
                ? "Aun no hay formaciones disponibles. Vuelve pronto para ver nuevo contenido."
                : "Intenta con otros filtros o terminos de busqueda"}
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
              <Card className="overflow-hidden h-full border-border/50 bg-card/40 backdrop-blur-xl hover:border-primary/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1.5 transition-all duration-500 group-hover:bg-card/60">
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500 z-10" />
                  {formation.thumbnailUrl ? (
                    <img 
                      src={formation.thumbnailUrl} 
                      alt={formation.title}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="h-8 w-8 text-primary/60" />
                      </div>
                    </div>
                  )}
                  
                  {/* Progress Overlay */}
                  {formation.isEnrolled && formation.progress > 0 && !formation.isCompleted && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-3">
                      <div className="flex items-center justify-between text-white text-xs mb-1.5">
                        <span className="font-medium">Progreso</span>
                        <span>{formation.progress}%</span>
                      </div>
                      <Progress value={formation.progress} className="h-1.5" />
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {formation.isPremium && (
                      <Badge className="bg-primary/90 text-primary-foreground border-0">
                        Premium
                      </Badge>
                    )}
                    {formation.isCompleted && (
                      <Badge className="bg-emerald-500 text-white border-0">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Completado
                      </Badge>
                    )}
                  </div>

                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                    <div className="w-16 h-16 rounded-full bg-background/80 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-110 transition-all duration-500 hover:bg-primary text-foreground hover:border-primary group/play">
                      {formation.isPremium && !formation.isEnrolled && !isLoggedIn ? (
                        <Lock className="h-6 w-6 text-muted-foreground group-hover/play:text-primary-foreground transition-colors" />
                      ) : (
                        <Play className="h-7 w-7 text-primary ml-1 group-hover/play:text-primary-foreground transition-colors" />
                      )}
                    </div>
                  </div>
                </div>

                <CardContent className="p-5">
                  {/* Difficulty */}
                  <div className="flex items-center gap-2 mb-3">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs font-medium",
                        difficultyColors[formation.difficulty] || difficultyColors.beginner
                      )}
                    >
                      {difficultyLabels[formation.difficulty] || "Principiante"}
                    </Badge>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-medium text-lg mb-2 text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {formation.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[2.5rem]">
                    {formation.description || "Descubre esta formacion transformadora."}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground pt-3 border-t border-border/50">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-primary/60" />
                        {formatDuration(formation.duration)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="h-4 w-4 text-primary/60" />
                        {formation.lessonsCount} lecciones
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
