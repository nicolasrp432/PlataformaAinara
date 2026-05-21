"use client"

import { useState } from "react"
import {
  Plus, Trash2, HelpCircle, ChevronDown, ChevronUp,
  Save, X, GripVertical,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

export interface QuizLesson {
  id: string
  title: string
  content_type: string
  modules: { id: string; title: string; formations: { id: string; title: string } | null } | null
}

export interface QuizListItem {
  id: string
  title: string
  description: string | null
  passing_score: number
  xp_reward: number
  created_at: string
  lessons: { id: string; title: string; modules: { id: string; title: string; formations: { id: string; title: string } | null } | null } | null
}

interface QuizOption {
  id?: string
  option_text: string
  is_correct: boolean
  sort_order: number
}

interface QuizQuestion {
  id?: string
  question: string
  type: "multiple_choice" | "true_false"
  explanation: string
  sort_order: number
  options: QuizOption[]
}

interface QuizAdminClientProps {
  quizzes: QuizListItem[]
  quizLessons: QuizLesson[]
}

const emptyQuestion = (order: number): QuizQuestion => ({
  question: "",
  type: "multiple_choice",
  explanation: "",
  sort_order: order,
  options: [
    { option_text: "", is_correct: true, sort_order: 0 },
    { option_text: "", is_correct: false, sort_order: 1 },
    { option_text: "", is_correct: false, sort_order: 2 },
    { option_text: "", is_correct: false, sort_order: 3 },
  ],
})

export function QuizAdminClient({ quizzes: initialQuizzes, quizLessons }: QuizAdminClientProps) {
  const [quizzes, setQuizzes] = useState(initialQuizzes)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null)

  // New quiz form state
  const [form, setForm] = useState({
    lessonId: "",
    title: "",
    description: "",
    passing_score: 70,
    xp_reward: 100,
    questions: [emptyQuestion(0)],
  })

  const addQuestion = () => {
    setForm((f) => ({
      ...f,
      questions: [...f.questions, emptyQuestion(f.questions.length)],
    }))
  }

  const removeQuestion = (idx: number) => {
    setForm((f) => ({
      ...f,
      questions: f.questions.filter((_, i) => i !== idx).map((q, i) => ({ ...q, sort_order: i })),
    }))
  }

  const updateQuestion = (idx: number, updates: Partial<QuizQuestion>) => {
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) => (i === idx ? { ...q, ...updates } : q)),
    }))
  }

  const updateOption = (qIdx: number, oIdx: number, updates: Partial<QuizOption>) => {
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) => {
        if (i !== qIdx) return q
        const options = q.options.map((o, j) => {
          if (j !== oIdx) return o
          return { ...o, ...updates }
        })
        // If setting is_correct = true, unset others (single correct answer)
        if (updates.is_correct) {
          return { ...q, options: options.map((o, j) => ({ ...o, is_correct: j === oIdx })) }
        }
        return { ...q, options }
      }),
    }))
  }

  const handleSaveQuiz = async () => {
    if (!form.lessonId || !form.title.trim()) {
      toast.error("Selecciona una lección y escribe un título.")
      return
    }
    if (form.questions.some((q) => !q.question.trim())) {
      toast.error("Todas las preguntas deben tener texto.")
      return
    }
    if (form.questions.some((q) => !q.options.some((o) => o.is_correct))) {
      toast.error("Cada pregunta debe tener al menos una respuesta correcta.")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/admin/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Error al guardar." }))
        toast.error(error ?? "Error al guardar el quiz.")
        return
      }
      const { quiz } = await res.json()
      setQuizzes((prev) => [quiz, ...prev])
      setCreating(false)
      setForm({ lessonId: "", title: "", description: "", passing_score: 70, xp_reward: 100, questions: [emptyQuestion(0)] })
      toast.success("Quiz creado correctamente.")
    } catch {
      toast.error("Error de conexión.")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm("¿Eliminar este quiz? Esta acción no se puede deshacer.")) return
    try {
      const res = await fetch(`/api/admin/quizzes/${quizId}`, { method: "DELETE" })
      if (!res.ok) { toast.error("Error al eliminar."); return }
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId))
      toast.success("Quiz eliminado.")
    } catch {
      toast.error("Error de conexión.")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quizzes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Crea evaluaciones para las lecciones de tipo Quiz.
          </p>
        </div>
        {!creating && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nuevo Quiz
          </Button>
        )}
      </div>

      {/* Create form */}
      {creating && (
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Nuevo Quiz</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setCreating(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lección Quiz</Label>
                <Select value={form.lessonId} onValueChange={(v) => setForm({ ...form, lessonId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar lección..." />
                  </SelectTrigger>
                  <SelectContent>
                    {quizLessons.length === 0 && (
                      <div className="p-2 text-sm text-muted-foreground">
                        No hay lecciones de tipo Quiz. Crea una lección con tipo &ldquo;Quiz&rdquo; primero.
                      </div>
                    )}
                    {quizLessons.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.title} — {l.modules?.formations?.title ?? ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Título del Quiz</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ej: Evaluación Módulo 1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descripción (opcional)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe el propósito de este quiz..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Puntaje mínimo para aprobar (%)</Label>
                <Input
                  type="number" min={1} max={100}
                  value={form.passing_score}
                  onChange={(e) => setForm({ ...form, passing_score: parseInt(e.target.value) || 70 })}
                />
              </div>
              <div className="space-y-2">
                <Label>XP al aprobar</Label>
                <Input
                  type="number" min={0}
                  value={form.xp_reward}
                  onChange={(e) => setForm({ ...form, xp_reward: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <Separator />

            {/* Questions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground">Preguntas ({form.questions.length})</h3>
                <Button variant="outline" size="sm" onClick={addQuestion}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Añadir pregunta
                </Button>
              </div>

              {form.questions.map((q, qIdx) => (
                <Card key={qIdx} className="border-border/60">
                  <CardHeader className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Pregunta {qIdx + 1}
                      </span>
                      <div className="ml-auto flex items-center gap-2">
                        <Select
                          value={q.type}
                          onValueChange={(v) => updateQuestion(qIdx, { type: v as "multiple_choice" | "true_false" })}
                        >
                          <SelectTrigger className="h-7 text-xs w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="multiple_choice">Opción múltiple</SelectItem>
                            <SelectItem value="true_false">Verdadero/Falso</SelectItem>
                          </SelectContent>
                        </Select>
                        {form.questions.length > 1 && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" onClick={() => removeQuestion(qIdx)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-3">
                    <Input
                      value={q.question}
                      onChange={(e) => updateQuestion(qIdx, { question: e.target.value })}
                      placeholder="Escribe la pregunta..."
                    />

                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Opciones (marca la correcta):</p>
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateOption(qIdx, oIdx, { is_correct: true })}
                            className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              opt.is_correct ? "border-primary bg-primary" : "border-border hover:border-primary/50"
                            }`}
                          >
                            {opt.is_correct && <div className="w-2 h-2 rounded-full bg-white" />}
                          </button>
                          <Input
                            value={opt.option_text}
                            onChange={(e) => updateOption(qIdx, oIdx, { option_text: e.target.value })}
                            placeholder={`Opción ${oIdx + 1}`}
                            className="flex-1"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Explicación (opcional)</Label>
                      <Input
                        value={q.explanation}
                        onChange={(e) => updateQuestion(qIdx, { explanation: e.target.value })}
                        placeholder="Se muestra al alumno después de responder..."
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreating(false)}>Cancelar</Button>
              <Button onClick={handleSaveQuiz} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Guardando..." : "Crear Quiz"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quiz list */}
      {quizzes.length === 0 && !creating ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <HelpCircle className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-muted-foreground">No hay quizzes todavía</p>
            <p className="text-sm text-muted-foreground/70 mt-1 max-w-xs">
              Primero crea una lección con tipo &ldquo;Quiz&rdquo;, luego regresa aquí para crear las preguntas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz) => {
            const lesson = quiz.lessons
            const formation = lesson?.modules?.formations

            return (
              <Card key={quiz.id} className="border-border/50">
                <CardHeader
                  className="py-4 cursor-pointer"
                  onClick={() => setExpandedQuiz(expandedQuiz === quiz.id ? null : quiz.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0">
                      <HelpCircle className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-foreground truncate">{quiz.title}</h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {formation?.title ? `${formation.title} → ` : ""}{lesson?.title ?? "Sin lección vinculada"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-xs">
                        Aprueba: {quiz.passing_score}%
                      </Badge>
                      <Badge variant="outline" className="text-xs text-primary border-primary/30">
                        +{quiz.xp_reward} XP
                      </Badge>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-destructive/60 hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); handleDeleteQuiz(quiz.id) }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      {expandedQuiz === quiz.id
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                </CardHeader>

                {expandedQuiz === quiz.id && quiz.description && (
                  <CardContent className="pt-0 pb-4">
                    <p className="text-sm text-muted-foreground">{quiz.description}</p>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
