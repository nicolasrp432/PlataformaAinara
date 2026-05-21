"use client"

import { useState, useEffect, useCallback } from "react"
import {
  CheckCircle2, XCircle, Sparkles, HelpCircle,
  ChevronRight, RefreshCw, Trophy, AlertCircle, Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface QuizOption {
  id: string
  option_text: string
  sort_order: number
}

interface QuizQuestion {
  id: string
  question: string
  type: string
  explanation: string | null
  sort_order: number
  options: QuizOption[]
}

interface QuizData {
  id: string
  title: string
  description: string | null
  passing_score: number
  xp_reward: number
  questions: QuizQuestion[]
}

interface AttemptResult {
  score: number
  passed: boolean
  passingScore: number
  results: Record<string, { selected: string; correct: string; isCorrect: boolean }>
  xpEarned: number
  leveledUp: boolean
}

interface QuizPlayerProps {
  lessonId: string
  formationSlug: string
  formationId: string
}

type Stage = "loading" | "error" | "intro" | "playing" | "results"

export function QuizPlayer({ lessonId, formationSlug }: QuizPlayerProps) {
  const [stage, setStage] = useState<Stage>("loading")
  const [quiz, setQuiz] = useState<QuizData | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<AttemptResult | null>(null)
  const [bestScore, setBestScore] = useState<number | null>(null)

  const loadQuiz = useCallback(async () => {
    setStage("loading")
    try {
      const res = await fetch(`/api/quiz/${lessonId}`)
      if (!res.ok) {
        setStage("error")
        return
      }
      const { quiz: quizData, bestAttempt } = await res.json()
      setQuiz(quizData)
      if (bestAttempt) setBestScore(bestAttempt.score)
      setStage("intro")
    } catch {
      setStage("error")
    }
  }, [lessonId])

  useEffect(() => {
    loadQuiz()
  }, [loadQuiz])

  const startQuiz = () => {
    setCurrentIndex(0)
    setAnswers({})
    setSelectedOption(null)
    setResult(null)
    setStage("playing")
  }

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId)
  }

  const handleNext = () => {
    if (!selectedOption || !quiz) return

    const currentQuestion = quiz.questions[currentIndex]
    const newAnswers = { ...answers, [currentQuestion.id]: selectedOption }
    setAnswers(newAnswers)
    setSelectedOption(null)

    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      submitQuiz(newAnswers)
    }
  }

  const submitQuiz = async (finalAnswers: Record<string, string>) => {
    if (!quiz) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: quiz.id,
          lessonId,
          formationSlug,
          answers: finalAnswers,
        }),
      })
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Error al enviar." }))
        toast.error(error ?? "Error al enviar el quiz.")
        setStage("playing")
        return
      }
      const data: AttemptResult = await res.json()
      setResult(data)
      setBestScore((prev) => (prev === null || data.score > prev ? data.score : prev))
      setStage("results")

      if (data.xpEarned > 0) {
        toast.success(`¡Quiz superado! +${data.xpEarned} XP`, {
          description: data.leveledUp ? "¡Subiste de nivel! 🎉" : undefined,
        })
      }
    } catch {
      toast.error("Error de conexión.")
      setStage("playing")
    } finally {
      setSubmitting(false)
    }
  }

  if (stage === "loading") {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-16 flex flex-col items-center gap-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Cargando quiz...</p>
      </div>
    )
  }

  if (stage === "error" || !quiz) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-muted-foreground">No se pudo cargar el quiz.</p>
        <Button variant="outline" onClick={loadQuiz} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" /> Reintentar
        </Button>
      </div>
    )
  }

  if (stage === "intro") {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20">
            <HelpCircle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <Badge variant="outline" className="text-primary border-primary/40 mb-1">Quiz</Badge>
            <h2 className="text-xl font-semibold text-foreground">{quiz.title}</h2>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>+{quiz.xp_reward} XP</span>
          </div>
        </div>

        {quiz.description && (
          <p className="text-muted-foreground text-sm leading-relaxed">{quiz.description}</p>
        )}

        <div className="grid grid-cols-3 gap-3">
          <Card className="border-border/50 bg-card/50 text-center p-4">
            <p className="text-2xl font-bold text-foreground">{quiz.questions.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Preguntas</p>
          </Card>
          <Card className="border-border/50 bg-card/50 text-center p-4">
            <p className="text-2xl font-bold text-foreground">{quiz.passing_score}%</p>
            <p className="text-xs text-muted-foreground mt-1">Para aprobar</p>
          </Card>
          <Card className="border-border/50 bg-card/50 text-center p-4">
            <p className="text-2xl font-bold text-primary">
              {bestScore !== null ? `${bestScore}%` : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Mejor intento</p>
          </Card>
        </div>

        <Button onClick={startQuiz} className="w-full bg-primary hover:bg-primary/90">
          {bestScore !== null ? "Intentar de nuevo" : "Comenzar Quiz"}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    )
  }

  if (stage === "playing") {
    const currentQuestion = quiz.questions[currentIndex]
    const progress = ((currentIndex) / quiz.questions.length) * 100

    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Progress header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Pregunta {currentIndex + 1} de {quiz.questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Question */}
        <Card className="border-border/60 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base font-medium text-foreground leading-relaxed">
              {currentQuestion.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {currentQuestion.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option.id)}
                className={cn(
                  "w-full text-left p-3.5 rounded-xl border text-sm transition-all",
                  selectedOption === option.id
                    ? "border-primary bg-primary/10 text-foreground font-medium"
                    : "border-border/50 hover:border-primary/30 hover:bg-primary/5 text-muted-foreground hover:text-foreground",
                )}
              >
                {option.option_text}
              </button>
            ))}
          </CardContent>
        </Card>

        <Button
          onClick={handleNext}
          disabled={!selectedOption || submitting}
          className="w-full bg-primary hover:bg-primary/90"
        >
          {submitting ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</>
          ) : currentIndex < quiz.questions.length - 1 ? (
            <>Siguiente <ChevronRight className="h-4 w-4 ml-2" /></>
          ) : (
            <>Finalizar Quiz <CheckCircle2 className="h-4 w-4 ml-2" /></>
          )}
        </Button>
      </div>
    )
  }

  // Results stage
  if (stage === "results" && result) {
    const passed = result.passed

    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Score header */}
        <div className={cn(
          "text-center p-6 rounded-2xl border",
          passed
            ? "bg-emerald-500/10 border-emerald-500/30"
            : "bg-destructive/10 border-destructive/30",
        )}>
          <div className="flex justify-center mb-3">
            {passed
              ? <Trophy className="h-10 w-10 text-emerald-500" />
              : <XCircle className="h-10 w-10 text-destructive/70" />}
          </div>
          <p className="text-4xl font-bold text-foreground">{result.score}%</p>
          <p className={cn(
            "text-sm font-medium mt-1",
            passed ? "text-emerald-600" : "text-destructive/80",
          )}>
            {passed ? "¡Aprobado!" : `No aprobado (mínimo ${result.passingScore}%)`}
          </p>
          {result.xpEarned > 0 && (
            <div className="flex items-center justify-center gap-1.5 mt-2 text-sm text-primary">
              <Sparkles className="h-4 w-4" />
              <span>+{result.xpEarned} XP ganados</span>
            </div>
          )}
        </div>

        {/* Answer review */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Revisión de respuestas</h3>
          {quiz.questions.map((q) => {
            const qResult = result.results[q.id]
            const isCorrect = qResult?.isCorrect
            const correctOption = q.options.find((o) => o.id === qResult?.correct)
            const selectedOption = q.options.find((o) => o.id === qResult?.selected)

            return (
              <Card key={q.id} className={cn(
                "border",
                isCorrect ? "border-emerald-500/30 bg-emerald-500/5" : "border-destructive/20 bg-destructive/5",
              )}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start gap-2">
                    {isCorrect
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      : <XCircle className="h-4 w-4 text-destructive/70 shrink-0 mt-0.5" />}
                    <p className="text-sm font-medium text-foreground">{q.question}</p>
                  </div>
                  {!isCorrect && (
                    <div className="ml-6 space-y-1 text-xs text-muted-foreground">
                      <p>Tu respuesta: <span className="text-destructive/80">{selectedOption?.option_text ?? "—"}</span></p>
                      <p>Correcta: <span className="text-emerald-600">{correctOption?.option_text ?? "—"}</span></p>
                    </div>
                  )}
                  {q.explanation && (
                    <p className="ml-6 text-xs text-muted-foreground italic border-l-2 border-border pl-2">
                      {q.explanation}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Button
          variant="outline"
          onClick={startQuiz}
          className="w-full border-border/50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Intentar de nuevo
        </Button>
      </div>
    )
  }

  return null
}
