"use client"

import { useState, useTransition } from "react"
import { Search, Trash2, MessageSquare, BookOpen, ExternalLink, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { deleteCommentAdmin } from "./actions"
import Link from "next/link"

interface CommentProfile {
  full_name: string | null
  avatar_url: string | null
  role: string | null
}

interface CommentLesson {
  title: string
  module?: {
    formation?: {
      title: string
    }
  } | null
}

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: CommentProfile | null
  lessons: CommentLesson | null
}

export function CommentsClient({ initialComments }: { initialComments: Comment[] }) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<"all" | "lessons" | "community">("all")
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = (commentId: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este comentario? Esta acción también eliminará todas las respuestas asociadas.")) {
      setDeletingId(commentId)
      startTransition(async () => {
        const res = await deleteCommentAdmin(commentId)
        setDeletingId(null)
        if (res?.error) {
          toast.error(res.error)
        } else {
          toast.success("Comentario eliminado correctamente")
          setComments((prev) => prev.filter((c) => c.id !== commentId))
        }
      })
    }
  }

  // Filter comments based on search query and type
  const filteredComments = comments.filter((comment) => {
    const matchesSearch =
      comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (comment.profiles?.full_name ?? "Usuario").toLowerCase().includes(searchQuery.toLowerCase())

    const isLessonComment = comment.lessons !== null
    const matchesType =
      filterType === "all" ||
      (filterType === "lessons" && isLessonComment) ||
      (filterType === "community" && !isLessonComment)

    return matchesSearch && matchesType
  })

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("es-ES", {
      dateStyle: "short",
      timeStyle: "short",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Comentarios</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Modera y gestiona los comentarios y reflexiones publicados en las lecciones y la Comunidad.
        </p>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por contenido o autor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>

        <div className="flex gap-2 self-stretch sm:self-auto justify-end">
          <Button
            variant={filterType === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("all")}
          >
            Todos
          </Button>
          <Button
            variant={filterType === "lessons" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("lessons")}
            className="gap-1.5"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Lecciones
          </Button>
          <Button
            variant={filterType === "community" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("community")}
            className="gap-1.5"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Comunidad
          </Button>
        </div>
      </div>

      {/* Comments List */}
      {filteredComments.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-muted-foreground">No se encontraron comentarios</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {searchQuery ? "Intenta con otra búsqueda o filtro." : "Aún no hay comentarios publicados."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredComments.map((comment) => {
            const isLessonComment = comment.lessons !== null
            const authorName = comment.profiles?.full_name ?? "Usuario Desconocido"
            const authorRole = comment.profiles?.role ?? "student"
            const lessonTitle = comment.lessons?.title
            // Safely grab formation title nested in module
            const formationTitle =
              comment.lessons?.module?.formation?.title || 
              "Formación"

            return (
              <Card
                key={comment.id}
                className="border-border/50 bg-card/60 backdrop-blur-md shadow-sm transition-all hover:border-primary/20 hover:shadow-md"
              >
                <CardContent className="p-5 flex flex-col md:flex-row md:items-start gap-4">
                  {/* Avatar and metadata */}
                  <div className="flex md:flex-col items-center md:items-center gap-3 shrink-0 text-center md:w-32 min-w-0">
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarImage src={comment.profiles?.avatar_url ?? ""} className="object-cover" />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {authorName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left md:text-center min-w-0 flex-1">
                      <p className="font-semibold text-sm text-foreground truncate w-full" title={authorName}>
                        {authorName}
                      </p>
                      <Badge variant="secondary" className="mt-1 bg-primary/15 text-primary text-[10px] uppercase font-bold tracking-wider px-2 py-0">
                        {authorRole === "admin" ? "Admin" : authorRole === "mentor" ? "Mentor" : "Alumno"}
                      </Badge>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 space-y-3 min-w-0">
                    {/* Origin Tag */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {isLessonComment ? (
                        <>
                          <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 text-[10px]">
                            Lección
                          </Badge>
                          <span className="truncate max-w-[200px] font-medium text-foreground" title={lessonTitle}>
                            {lessonTitle}
                          </span>
                          <span className="text-muted-foreground/60">•</span>
                          <span className="truncate max-w-[150px] italic">{formationTitle}</span>
                        </>
                      ) : (
                        <Badge variant="outline" className="text-purple-500 border-purple-500/20 bg-purple-500/5 text-[10px]">
                          Comunidad
                        </Badge>
                      )}
                      <span className="text-muted-foreground/60 ml-auto flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(comment.created_at)}
                      </span>
                    </div>

                    {/* Content Text */}
                    <p className="text-foreground text-sm whitespace-pre-wrap leading-relaxed">
                      {comment.content}
                    </p>

                    {/* Actions Row */}
                    <div className="flex items-center gap-4 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-xs text-muted-foreground hover:text-foreground h-8 px-2"
                      >
                        <Link href={`/u/${comment.user_id}`} target="_blank" rel="noreferrer" className="gap-1">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Ver Perfil
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <div className="self-end md:self-start shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isPending || deletingId === comment.id}
                      onClick={() => handleDelete(comment.id)}
                      className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 h-9 w-9 rounded-lg"
                      title="Eliminar Comentario"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
