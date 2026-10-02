"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Loader2, Copy, Check, RotateCcw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { RichText } from "@/components/ui/rich-text"
import { SseDecoder } from "@/lib/ai-stream"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  isError?: boolean
  rawPrompt?: string
}

interface ChatPanelProps {
  lessonId?: string
  formationId?: string
  className?: string
}

const QUICK_SUGGESTIONS = [
  {
    label: "💡 ¿Cómo aplico esto en mi vida?",
    prompt: "¿Cómo puedo aplicar los conceptos de esta lección en mi vida cotidiana de forma práctica?",
  },
  {
    label: "🧘 Guíame en una reflexión",
    prompt: "Hazme 2 preguntas poderosas de autoconocimiento basadas en esta lección.",
  },
  {
    label: "📖 Resumen en 3 puntos",
    prompt: "Dame un resumen conciso en 3 puntos clave de lo que debo recordar.",
  },
]

export function ChatPanel({ lessonId, formationId, className }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isRestoring,setIsRestoring] = useState(true)
  const [historyError,setHistoryError] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const requestRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    requestRef.current?.abort()
    setMessages([])
    setConversationId(null)
    setIsStreaming(false)
    setIsRestoring(true)
    setHistoryError(null)
    const abort = new AbortController()
    const query = new URLSearchParams()
    if (lessonId) query.set("lessonId",lessonId)
    if (formationId) query.set("formationId",formationId)
    fetch(`/api/ai/chat?${query}`,{ signal: abort.signal })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "No se pudo recuperar el historial."); return data })
      .then(data => { if (!abort.signal.aborted) { setConversationId(data.conversationId); setMessages(data.messages ?? []) } })
      .catch(error => { if (!abort.signal.aborted) setHistoryError(error.message) })
      .finally(() => { if (!abort.signal.aborted) setIsRestoring(false) })
    return () => { abort.abort(); requestRef.current?.abort(); requestRef.current = null }
  }, [lessonId, formationId])

  useEffect(() => {
    const area = scrollRef.current
    if (area) area.scrollTop = area.scrollHeight
  }, [messages])

  const handleCopyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      toast.success("Respuesta copiada al portapapeles")
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error("No se pudo copiar el texto")
    }
  }

  const handleSendPrompt = (promptText: string) => {
    setInput(promptText)
    sendMessage(promptText)
  }

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim()
    if (!trimmed || requestRef.current || isRestoring) return
    const abort = new AbortController()
    requestRef.current = abort
    const assistantId = crypto.randomUUID()
    setMessages(prev => [...prev,
      { id: crypto.randomUUID(), role: "user", content: trimmed, rawPrompt: trimmed },
      { id: assistantId, role: "assistant", content: "", rawPrompt: trimmed },
    ])
    setInput("")
    setIsStreaming(true)
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST", signal: abort.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, conversationId, lessonId, formationId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? "El asistente no está disponible ahora.")
      }
      if (!res.body) throw new Error("No se recibió una respuesta.")
      const convId = res.headers.get("X-Conversation-Id")
      if (convId) setConversationId(convId)
      reader = res.body.getReader()
      const parser = new SseDecoder()
      let completed = false
      let received = false
      const consume = (events: string[]) => {
        for (const event of events) {
          if (event === "[DONE]") { completed = true; break }
          const data = JSON.parse(event)
          if (data.error) throw new Error(data.error)
          if (typeof data.text === "string" && data.text) {
            received = true
            setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: m.content + data.text } : m))
          }
        }
      }
      while (!completed) {
        const { done, value } = await reader.read()
        if (done) { consume(parser.finish()); break }
        consume(parser.push(value))
      }
      if (!completed || !received) throw new Error("La respuesta quedó incompleta. Puedes reintentar tu pregunta.")
    } catch (error) {
      if (requestRef.current !== abort) return
      const message = abort.signal.aborted ? "Respuesta detenida." : error instanceof Error ? error.message : "Error de conexión. Inténtalo de nuevo."
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: m.content ? `${m.content}\n\n${message}` : message, isError: true } : m))
      if (!abort.signal.aborted) toast.error(message)
    } finally {
      await reader?.cancel().catch(() => {})
      reader?.releaseLock()
      if (requestRef.current === abort) { requestRef.current = null; setIsStreaming(false) }
    }
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    sendMessage(input)
  }

  const handleRetry = (rawPrompt?: string) => {
    if (!rawPrompt) return
    sendMessage(rawPrompt)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className={cn("flex flex-col min-h-0", className)}>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border pb-2 text-xs text-muted-foreground"><span>{isRestoring ? "Recuperando tu conversación…" : "Conversación privada"}</span><button type="button" className="rounded-md px-2 py-1 text-primary hover:bg-primary/10" disabled={isStreaming || isRestoring} onClick={() => { setMessages([]); setConversationId(null); setHistoryError(null) }}>Nueva conversación</button></div>
      {historyError && <p role="alert" className="pt-2 text-xs text-warning-strong">{historyError}</p>}
      {/* Messages */}
      <div ref={scrollRef} role="log" aria-label="Conversación con el asistente" className="flex-1 overflow-y-auto py-3.5 space-y-4 px-1">
        {messages.length === 0 && !isRestoring && (
          <div className="text-center py-8 text-muted-foreground space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto text-primary shadow-inner">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm flex items-center justify-center gap-1.5">
                <span>Asistente Mitra</span>
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
                {lessonId
                  ? "Pregúntame cualquier duda sobre el contenido de esta lección o pide orientación práctica para tu día a día."
                  : "Pregúntame sobre tus formaciones, reflexiones o pide una guía de autoconocimiento personalizada."}
              </p>
            </div>

            {/* Quick prompt chips */}
            <div className="pt-2 flex flex-col gap-2 max-w-sm mx-auto px-2">
              <span className="text-3xs uppercase tracking-wider text-muted-foreground/80 font-bold">
                Preguntas sugeridas
              </span>
              {QUICK_SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendPrompt(s.prompt)}
                  className="text-left text-xs font-medium px-3.5 py-2.5 rounded-lg border border-border/70 bg-card hover:bg-primary/10 hover:border-primary/40 text-foreground transition-all duration-150 shadow-xs active:scale-[0.98]"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3 items-start",
              msg.role === "user" ? "flex-row-reverse ml-6" : "mr-4"
            )}
          >
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs shadow-xs",
                msg.role === "user"
                  ? "bg-primary border-primary text-primary-foreground font-bold"
                  : "bg-card border-border/80 text-primary"
              )}
            >
              {msg.role === "user" ? (
                <User className="h-3.5 w-3.5" />
              ) : (
                <Bot className="h-3.5 w-3.5 text-primary" />
              )}
            </div>

            <div className="flex-1 max-w-[85%] space-y-1.5">
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed break-words shadow-xs relative group",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-xs"
                    : msg.isError
                    ? "bg-destructive/10 border border-destructive/30 text-destructive rounded-tl-xs"
                    : "bg-card border border-border/70 text-foreground rounded-tl-xs"
                )}
              >
                {msg.content ? (
                  <RichText text={msg.content} />
                ) : (
                  <span className="flex gap-2 items-center text-muted-foreground text-xs py-1">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>Preparando tu respuesta…</span>
                  </span>
                )}
              </div>

              {/* Acciones auxiliares bajo la burbuja del asistente */}
              {msg.role === "assistant" && msg.content && (
                <div className="flex items-center gap-2 px-1 text-3xs text-muted-foreground">
                  {!msg.isError && (
                    <button
                      type="button"
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors py-0.5 px-1 rounded hover:bg-muted/40"
                      title="Copiar respuesta"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="h-3 w-3 text-success" />
                          <span className="text-success">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  )}

                  {msg.isError && msg.rawPrompt && (
                    <button
                      type="button"
                      onClick={() => handleRetry(msg.rawPrompt)}
                      disabled={isStreaming || isRestoring}
                      className="inline-flex items-center gap-1 text-primary hover:underline py-0.5 px-1 rounded font-medium"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Reintentar</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border pt-3 pb-1">
        {isStreaming && <Button type="button" variant="outline" size="sm" className="mb-2" onClick={() => requestRef.current?.abort()}>Detener respuesta</Button>}
        <p className="mb-3 text-xs text-muted-foreground">Asistente de IA para aprender. Puede equivocarse; contrasta sus respuestas con la clase.</p>
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <Textarea
            aria-label="Tu pregunta al asistente"
            maxLength={6000}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu pregunta…"
            rows={1}
            disabled={isStreaming || isRestoring}
            className="resize-none min-h-[42px] max-h-32 bg-card rounded-lg border-border/80 px-3.5 py-2.5 text-xs sm:text-sm focus-visible:ring-primary/20 placeholder:text-muted-foreground/60"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isStreaming || isRestoring || !input.trim()}
            className="shrink-0 rounded-lg h-10 w-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs transition-transform active:scale-95"
            title="Enviar mensaje"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
