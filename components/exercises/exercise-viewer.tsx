"use client"

import { useState, useEffect } from "react"
import {
  CheckCircle2,
  Sparkles,
  FileText,
  ExternalLink,
  Pencil,
  Save,
  Share2,
  Copy,
  BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ExerciseResource {
  title: string
  url: string
  type: "pdf" | "link" | "video"
}

interface ExerciseViewerProps {
  lesson: {
    id: string
    title: string
    description: string | null
    transcript: string | null
    xpReward: number
    isCompleted: boolean
    resources?: ExerciseResource[] | null
  }
  isCompleted: boolean
  onComplete: () => Promise<void>
  isSaving?: boolean
}

export function ExerciseViewer({
  lesson,
  isCompleted,
  onComplete,
  isSaving,
}: ExerciseViewerProps) {
  const router = useRouter()
  const storageKey = `exercise_note:${lesson.id}`
  const [response, setResponse] = useState("")
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  // Cargar notas guardadas
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        setResponse(saved)
        setLastSaved("Guardado")
      }
    } catch {
      // safe fallback
    }
  }, [storageKey])

  const handleResponseChange = (text: string) => {
    setResponse(text)
    try {
      localStorage.setItem(storageKey, text)
      setLastSaved("Guardado")
    } catch {
      // safe fallback
    }
  }

  const handleCopyNotes = () => {
    if (!response.trim()) {
      toast.info("Escribe algo antes de copiar tus notas.")
      return
    }
    navigator.clipboard.writeText(
      `Ejercicio: ${lesson.title}\n\nMi respuesta:\n${response}`
    )
    toast.success("¡Notas copiadas al portapapeles!")
  }

  const handleShareToCommunity = () => {
    if (!response.trim()) {
      toast.info("Escribe tu reflexión para compartirla con la comunidad.")
      return
    }
    sessionStorage.setItem(
      "taberna_draft",
      JSON.stringify({
        content: `💡 Reflexión sobre el ejercicio "${lesson.title}":\n\n${response}`,
        source: lesson.title,
      })
    )
    toast.success("Abriendo La Taberna con tu reflexión...")
    router.push("/taberna")
  }

  const instructions = lesson.transcript || lesson.description

  return (
    <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-5">
      {/* Header badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-primary/20 bg-primary/10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 text-primary border border-primary/30 shadow-sm">
            <Pencil className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-primary border-primary/40 text-3xs font-semibold tracking-wider rounded">
                PRÁCTICA & INTEGRACIÓN
              </Badge>
              {lastSaved && (
                <span className="text-2xs text-muted-foreground hidden sm:inline">
                  ✓ {lastSaved}
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-foreground mt-0.5">{lesson.title}</h2>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-xs font-semibold text-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>+{lesson.xpReward} XP</span>
        </div>
      </div>

      {/* Completion badge */}
      {isCompleted && (
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-success-soft border border-success rounded-xl text-success-strong dark:text-success text-xs sm:text-sm font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">¡Ejercicio completado e integrado!</p>
            <p className="text-2xs text-muted-foreground">Tus notas quedan guardadas en tu cuaderno personal para que las consultes cuando desees.</p>
          </div>
        </div>
      )}

      {/* Instructions */}
      {instructions && (
        <Card className="border border-border bg-card/60 rounded-xl shadow-sm">
          <CardHeader className="pb-2.5 pt-4 px-4 sm:px-5">
            <CardTitle className="text-sm sm:text-base text-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Instrucciones y Guía Paso a Paso
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-5 pb-4">
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
              {instructions}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Resources */}
      {lesson.resources && lesson.resources.length > 0 && (
        <Card className="border border-border bg-card/60 rounded-xl shadow-sm">
          <CardHeader className="pb-2.5 pt-4 px-4 sm:px-5">
            <CardTitle className="text-sm font-semibold text-foreground">Materiales de Apoyo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 px-4 sm:px-5 pb-4">
            {lesson.resources.map((res, i) => (
              <a
                key={i}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-background/50 hover:border-primary/40 hover:bg-primary/5 transition-[transform,background-color,border-color,color,box-shadow,opacity] group"
              >
                <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-foreground flex-1">{res.title}</span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
              </a>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Response area - Cuaderno de Trabajo */}
      <Card className="border border-primary/25 bg-card/80 rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="pb-2.5 pt-4 px-4 sm:px-5 border-b border-border/40">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm sm:text-base text-foreground flex items-center gap-2">
                <Pencil className="h-4 w-4 text-primary" />
                Tu Cuaderno de Práctica Personal
              </CardTitle>
              <p className="text-2xs text-muted-foreground mt-0.5">
                Tómate un momento de silencio para reflexionar y plasmar tus respuestas.
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyNotes}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground rounded-lg"
                title="Copiar notas"
              >
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copiar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShareToCommunity}
                className="h-8 px-2 text-xs text-primary hover:bg-primary/10 rounded-lg"
                title="Compartir en la comunidad"
              >
                <Share2 className="h-3.5 w-3.5 mr-1" />
                Comunidad
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-3">
          <Textarea
            value={response}
            onChange={(e) => handleResponseChange(e.target.value)}
            placeholder="Escribe libremente lo que sentiste, tus conclusiones, las sombras o virtudes que identificaste..."
            rows={7}
            className="resize-none bg-background rounded-lg border-border px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed placeholder:text-muted-foreground/60 focus:border-primary"
          />

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
            <span className="text-2xs text-muted-foreground">
              {response.length > 0 ? `${response.split(/\s+/).filter(Boolean).length} palabras escritas` : "Cuaderno privado y seguro"}
            </span>

            {!isCompleted ? (
              <Button
                onClick={onComplete}
                disabled={isSaving}
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 rounded-lg h-9 text-xs shadow-sm"
              >
                {isSaving ? (
                  "Guardando..."
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                    Completar Ejercicio · +{lesson.xpReward} XP
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.success("Notas guardadas correctamente.")}
                className="border-primary/30 text-primary hover:bg-primary/5 rounded-lg text-xs h-8"
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Guardar cambios
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
