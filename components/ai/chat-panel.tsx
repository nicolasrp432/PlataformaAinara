"use client"

import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowRight, Check, Copy, Loader2, RotateCcw, Send, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { RichText } from "@/components/ui/rich-text"
import { SseDecoder } from "@/lib/ai-stream"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type ErrorCode = "CONFIG_UNAVAILABLE" | "TEMPORARY_DELAY" | "HISTORY_UNAVAILABLE" | "CONNECTION_LOST"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  isError?: boolean
  errorCode?: ErrorCode
  rawPrompt?: string
}

interface ChatPanelProps {
  lessonId?: string
  formationId?: string
  className?: string
}

const INTENTIONS = [
  { eyebrow: "Llevarlo a la práctica", title: "Aplicar lo aprendido", description: "Convierte una idea de la lección en un paso concreto para hoy.", prompt: "¿Cómo puedo aplicar los conceptos de esta lección en mi vida cotidiana de forma práctica?" },
  { eyebrow: "Mirar hacia dentro", title: "Abrir una reflexión", description: "Explora el tema con dos preguntas de autoconocimiento.", prompt: "Hazme 2 preguntas poderosas de autoconocimiento basadas en esta lección." },
  { eyebrow: "Ordenar las ideas", title: "Recordar lo esencial", description: "Resume el contenido en tres claves claras y memorables.", prompt: "Dame un resumen conciso en 3 puntos clave de lo que debo recordar." },
]

const ERROR_CONTENT: Record<ErrorCode, { title: string; body: string }> = {
  CONFIG_UNAVAILABLE: { title: "El asistente no está configurado", body: "Esta función no está disponible ahora. Puedes continuar con el contenido y volver más tarde." },
  TEMPORARY_DELAY: { title: "Estamos tardando más de lo habitual", body: "El asistente está ocupado temporalmente. Tu pregunta sigue aquí para que puedas reintentarlo." },
  HISTORY_UNAVAILABLE: { title: "No pudimos abrir tu historial", body: "Puedes volver a intentarlo o empezar sin recuperar los mensajes anteriores." },
  CONNECTION_LOST: { title: "Se perdió la conexión", body: "Comprueba tu conexión y vuelve a intentarlo. No necesitas escribir la pregunta otra vez." },
}

function errorCodeFrom(status?: number, code?: string): ErrorCode {
  if (code && code in ERROR_CONTENT) return code as ErrorCode
  if (status === 503) return "TEMPORARY_DELAY"
  return "CONNECTION_LOST"
}

export function ChatPanel({ lessonId, formationId, className }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isRestoring, setIsRestoring] = useState(true)
  const [historyError, setHistoryError] = useState<ErrorCode | null>(null)
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [announcement, setAnnouncement] = useState("")
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const requestRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const startFresh = useCallback(() => {
    requestRef.current?.abort()
    requestRef.current = null
    setMessages([])
    setConversationId(null)
    setHistoryError(null)
    setIsStreaming(false)
    setAnnouncement("Nueva conversación preparada")
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  const restoreHistory = useCallback(async (signal?: AbortSignal) => {
    setIsRestoring(true)
    setHistoryError(null)
    const query = new URLSearchParams()
    if (lessonId) query.set("lessonId", lessonId)
    if (formationId) query.set("formationId", formationId)
    try {
      const response = await fetch(`/api/ai/chat?${query}`, { signal })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw Object.assign(new Error(), { status: response.status, code: data.code })
      if (!signal?.aborted) {
        setConversationId(data.conversationId)
        setMessages(data.messages ?? [])
      }
    } catch (error) {
      if (!signal?.aborted) setHistoryError(errorCodeFrom((error as { status?: number }).status, (error as { code?: string }).code) === "CONNECTION_LOST" ? "CONNECTION_LOST" : "HISTORY_UNAVAILABLE")
    } finally {
      if (!signal?.aborted) setIsRestoring(false)
    }
  }, [formationId, lessonId])

  useEffect(() => {
    requestRef.current?.abort()
    setMessages([])
    setConversationId(null)
    const abort = new AbortController()
    void restoreHistory(abort.signal)
    return () => { abort.abort(); requestRef.current?.abort(); requestRef.current = null }
  }, [restoreHistory])

  useEffect(() => {
    const area = scrollRef.current
    if (area) area.scrollTo({ top: area.scrollHeight, behavior: isStreaming ? "auto" : "smooth" })
  }, [messages, isStreaming])

  const handleCopyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      toast.success("Respuesta copiada al portapapeles")
      setTimeout(() => setCopiedId(null), 2000)
    } catch { toast.error("No se pudo copiar el texto") }
  }

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim()
    if (!trimmed || requestRef.current || isRestoring) return
    const abort = new AbortController()
    requestRef.current = abort
    const assistantId = crypto.randomUUID()
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "user", content: trimmed, rawPrompt: trimmed }, { id: assistantId, role: "assistant", content: "", rawPrompt: trimmed }])
    setInput("")
    setIsStreaming(true)
    setAnnouncement("El asistente está preparando una respuesta")
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined
    try {
      const res = await fetch("/api/ai/chat", { method: "POST", signal: abort.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: trimmed, conversationId, lessonId, formationId }) })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw Object.assign(new Error(), { status: res.status, code: data.code })
      }
      if (!res.body) throw Object.assign(new Error(), { code: "CONNECTION_LOST" })
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
          if (data.error) throw Object.assign(new Error(), { code: data.code ?? "TEMPORARY_DELAY" })
          if (typeof data.text === "string" && data.text) {
            received = true
            setMessages(prev => prev.map(message => message.id === assistantId ? { ...message, content: message.content + data.text } : message))
          }
        }
      }
      while (!completed) {
        const { done, value } = await reader.read()
        if (done) { consume(parser.finish()); break }
        consume(parser.push(value))
      }
      if (!completed || !received) throw Object.assign(new Error(), { code: "TEMPORARY_DELAY" })
      setAnnouncement("Respuesta completada")
    } catch (error) {
      if (requestRef.current !== abort) return
      const stopped = abort.signal.aborted
      const code = stopped ? "TEMPORARY_DELAY" : errorCodeFrom((error as { status?: number }).status, (error as { code?: string }).code)
      const content = stopped ? "Respuesta detenida. Puedes reintentarlo cuando quieras." : ERROR_CONTENT[code].body
      setMessages(prev => prev.map(message => message.id === assistantId ? { ...message, content: message.content ? `${message.content}\n\n${content}` : content, isError: true, errorCode: code } : message))
      setAnnouncement(stopped ? "Respuesta detenida" : ERROR_CONTENT[code].title)
    } finally {
      await reader?.cancel().catch(() => {})
      reader?.releaseLock()
      if (requestRef.current === abort) { requestRef.current = null; setIsStreaming(false) }
    }
  }

  const handleSubmit = (event?: React.FormEvent) => { event?.preventDefault(); void sendMessage(input) }

  return (
    <section className={cn("flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/40", className)} aria-labelledby="assistant-title">
      <header className="relative shrink-0 overflow-hidden border-b border-border/70 bg-card px-5 py-4 sm:px-6">
        <div className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden="true" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Cuaderno de aprendizaje</p>
            <h2 id="assistant-title" className="font-serif text-xl font-semibold tracking-tight text-foreground">Una conversación para integrar</h2>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span className={cn("h-2 w-2 rounded-full", isRestoring ? "animate-pulse bg-amber-500 motion-reduce:animate-none" : "bg-emerald-500")} aria-hidden="true" />
              <span>{isRestoring ? "Recuperando tu conversación…" : "Disponible para acompañar tu aprendizaje"}</span>
            </div>
          </div>
          <button type="button" className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary outline-none transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transition-none" disabled={isStreaming || isRestoring} onClick={startFresh}>Empezar de nuevo</button>
        </div>
      </header>

      <p className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</p>

      {historyError && (
        <div role="alert" className="m-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          <p className="font-semibold text-foreground">{ERROR_CONTENT[historyError].title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ERROR_CONTENT[historyError].body}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => void restoreHistory()}><RotateCcw className="mr-1.5 h-3.5 w-3.5" />Reintentar</Button>
            <Button type="button" size="sm" variant="ghost" onClick={startFresh}>Continuar sin historial</Button>
          </div>
        </div>
      )}

      <div ref={scrollRef} role="log" aria-label="Conversación con el asistente" aria-busy={isStreaming} className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
        {messages.length === 0 && !isRestoring && !historyError && (
          <div className="mx-auto max-w-2xl py-3 text-center">
            <Image src="/asistente-mitra-bienvenida.svg" width={160} height={160} priority alt="Ilustración de Mitra, un pequeño asistente no humano con forma redondeada y un libro abierto" className="mx-auto h-32 w-32 object-contain sm:h-40 sm:w-40" />
            <p className="mt-2 font-serif text-2xl font-semibold text-foreground">Hola, estoy aquí para pensar contigo.</p>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">Soy Mitra, el asistente de aprendizaje. Puedo ayudarte a ordenar ideas, abrir preguntas y llevar esta formación a tu experiencia, a tu ritmo.</p>
            <div className="mt-7 grid gap-3 text-left sm:grid-cols-3" aria-label="Formas de empezar">
              {INTENTIONS.map(intention => (
                <button key={intention.title} type="button" onClick={() => void sendMessage(intention.prompt)} className="group rounded-xl border border-border/80 bg-card p-4 text-left shadow-xs outline-none transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:translate-y-0 motion-reduce:transform-none motion-reduce:transition-none">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{intention.eyebrow}</span>
                  <span className="mt-2 flex items-center justify-between gap-2 text-sm font-semibold text-foreground">{intention.title}<ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" /></span>
                  <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">{intention.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(message => (
          <div key={message.id} className={cn("flex items-start gap-3", message.role === "user" ? "ml-6 flex-row-reverse" : "mr-4")}>
            <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl border shadow-xs", message.role === "user" ? "border-primary bg-primary text-primary-foreground" : "border-border/80 bg-[#faf2e1]")}>
              {message.role === "user" ? <User className="h-4 w-4" aria-hidden="true" /> : <Image src="/asistente-mitra-avatar.svg" width={32} height={32} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="max-w-[85%] flex-1 space-y-1.5">
              <div className={cn("relative rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs sm:text-sm", message.role === "user" ? "rounded-tr-sm bg-primary text-primary-foreground" : message.isError ? "rounded-tl-sm border border-amber-500/30 bg-amber-500/10 text-foreground" : "rounded-tl-sm border border-border/70 bg-card text-foreground")}>
                {message.content ? <RichText text={message.content} /> : <span className="flex items-center gap-2 py-1 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />Preparando tu respuesta…</span>}
              </div>
              {message.role === "assistant" && message.content && (
                <div className="flex items-center gap-2 px-1 text-[10px] text-muted-foreground">
                  {!message.isError && <button type="button" onClick={() => void handleCopyMessage(message.id, message.content)} className="inline-flex items-center gap-1 rounded px-1 py-0.5 outline-none hover:bg-muted/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary">{copiedId === message.id ? <><Check className="h-3 w-3 text-emerald-600" />Copiado</> : <><Copy className="h-3 w-3" />Copiar</>}</button>}
                  {message.isError && message.rawPrompt && <button type="button" onClick={() => void sendMessage(message.rawPrompt!)} disabled={isStreaming || isRestoring} className="inline-flex items-center gap-1 rounded px-1 py-0.5 font-semibold text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary"><RotateCcw className="h-3 w-3" />Reintentar</button>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <footer className="shrink-0 border-t border-border bg-card/80 px-4 py-3 sm:px-6">
        {isStreaming && <Button type="button" variant="outline" size="sm" className="mb-2" onClick={() => requestRef.current?.abort()}>Detener respuesta</Button>}
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground"><strong className="font-semibold text-foreground">Una guía formativa:</strong> las respuestas pueden contener errores y no sustituyen el apoyo de profesionales cualificados.</p>
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <Textarea ref={inputRef} aria-label="Tu pregunta al asistente" maxLength={6000} value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); handleSubmit() } }} placeholder="Escribe lo que te gustaría explorar…" rows={1} disabled={isStreaming || isRestoring} className="min-h-[42px] max-h-32 resize-none rounded-lg border-border/80 bg-card px-3.5 py-2.5 text-xs placeholder:text-muted-foreground/60 focus-visible:ring-primary/30 sm:text-sm" />
          <Button type="submit" size="icon" disabled={isStreaming || isRestoring || !input.trim()} className="h-10 w-10 shrink-0 rounded-lg shadow-xs active:scale-95 motion-reduce:transform-none" aria-label="Enviar mensaje">{isStreaming ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Send className="h-4 w-4" />}</Button>
        </form>
      </footer>
    </section>
  )
}
