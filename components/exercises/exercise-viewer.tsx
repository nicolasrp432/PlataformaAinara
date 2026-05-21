"use client"

import { useState } from "react"
import { CheckCircle2, Sparkles, FileText, ExternalLink, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

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

export function ExerciseViewer({ lesson, isCompleted, onComplete, isSaving }: ExerciseViewerProps) {
  const [response, setResponse] = useState("")

  // Instructions come from transcript (rich) or description (short)
  const instructions = lesson.transcript || lesson.description

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20">
          <Pencil className="h-5 w-5 text-primary" />
        </div>
        <div>
          <Badge variant="outline" className="text-primary border-primary/40 mb-1">
            Ejercicio Práctico
          </Badge>
          <h2 className="text-xl font-semibold text-foreground">{lesson.title}</h2>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>+{lesson.xpReward} XP</span>
        </div>
      </div>

      {/* Completion badge */}
      {isCompleted && (
        <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 text-sm font-medium">
          <CheckCircle2 className="h-4 w-4" />
          ¡Ejercicio completado!
        </div>
      )}

      {/* Instructions */}
      {instructions && (
        <Card className="border-border/60 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground">Instrucciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-sm">
              {instructions}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Resources */}
      {lesson.resources && lesson.resources.length > 0 && (
        <Card className="border-border/60 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground">Materiales de Apoyo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lesson.resources.map((res, i) => (
              <a
                key={i}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-colors group"
              >
                <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                <span className="text-sm text-foreground flex-1">{res.title}</span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
              </a>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Response area */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-foreground">Tu Respuesta / Reflexión</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Esta es tu reflexión personal. No se guarda ni se comparte — es solo para ti.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Escribe tu reflexión, respuesta o lo que practicaste..."
            rows={6}
            className="resize-none bg-background border-border/60 focus-visible:ring-1 focus-visible:ring-primary/30"
          />

          {!isCompleted && (
            <Button
              onClick={onComplete}
              disabled={isSaving}
              className={cn(
                "w-full sm:w-auto bg-primary hover:bg-primary/90",
              )}
            >
              {isSaving ? (
                "Guardando..."
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marcar como completado · +{lesson.xpReward} XP
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
