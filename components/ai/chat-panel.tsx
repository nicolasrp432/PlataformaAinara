"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface ChatPanelProps {
  lessonId?: string
  formationId?: string
  className?: string
}

const QUICK_SUGGESTIONS = [
  { label: "💡 ¿Cómo aplico esto en mi vida?", prompt: "¿Cómo puedo aplicar los conceptos de esta lección en mi vida cotidiana de forma práctica?" },
  { label: "🧘 Guíame en una reflexión", prompt: "Hazme 2 preguntas poderosas de autoconocimiento basadas en esta lección." },
  { label: "📖 Resumen en 3 puntos", prompt: "Dame un resumen conciso en 3 puntos clave de lo que debo recordar." },
]

export function ChatPanel({ lessonId, formationId, className }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendPrompt = (promptText: string) => {
    setInput(promptText)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return

    const userMsg: Message = { id: `user-${Date.now()}`, role: "user", content: trimmed }
    const assistantId = `assistant-${Date.now()}`

    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: "assistant", content: "" }])
    setInput("")
    setIsStreaming(true)

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, conversationId, lessonId, formationId }),
      })

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Error al conectar con el asistente." }))
        toast.error(error ?? "Error al conectar con el asistente.")
        setMessages((prev) => prev.filter((m) => m.id !== assistantId))
        return
      }

      const convId = res.headers.get("X-Conversation-Id")
      if (convId && !conversationId) setConversationId(convId)

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const data = line.slice(6)
          if (data === "[DONE]") break
          try {
            const { text } = JSON.parse(data)
            if (text) {
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + text } : m)),
              )
            }
          } catch {
            /* skip malformed */
          }
        }
      }
    } catch {
      toast.error("Error de conexión con el asistente.")
      setMessages((prev) => prev.filter((m) => m.id !== `assistant-${Date.now()}`))
    } finally {
      setIsStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className={cn("flex flex-col min-h-0", className)}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3.5">
        {messages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground space-y-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto text-primary">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Asistente Ainara</p>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-xs mx-auto">
                {lessonId
                  ? "Pregúntame cualquier duda sobre el contenido de esta lección o pide orientación para tu práctica."
                  : "Pregúntame sobre tus formaciones, reflexiones y camino de autoconocimiento."}
              </p>
            </div>

            {/* Quick prompt chips */}
            <div className="pt-2 flex flex-col gap-1.5 max-w-sm mx-auto px-2">
              {QUICK_SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendPrompt(s.prompt)}
                  className="text-left text-xs font-medium px-3 py-2 rounded-lg border border-border bg-card hover:bg-primary/10 hover:border-primary/30 text-foreground transition-all shadow-sm active:scale-95"
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
              "flex gap-2.5 items-start",
              msg.role === "user" ? "flex-row-reverse ml-6" : "mr-6",
            )}
          >
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs",
                msg.role === "user"
                  ? "bg-primary border-primary text-primary-foreground font-bold"
                  : "bg-muted border-border text-muted-foreground",
              )}
            >
              {msg.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5 text-primary" />}
            </div>
            <div
              className={cn(
                "rounded-xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed break-words shadow-sm",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-none"
                  : "bg-card border border-border text-foreground rounded-tl-none",
              )}
            >
              {msg.content ? (
                <span className="whitespace-pre-wrap">{msg.content}</span>
              ) : (
                <span className="flex gap-1.5 items-center text-muted-foreground text-xs">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Conectando intuición...
                </span>
              )}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border pt-2.5 pb-1">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pregunta lo que necesites..."
            rows={1}
            disabled={isStreaming}
            className="resize-none min-h-[38px] max-h-28 bg-card rounded-lg border-border px-3 py-2 text-xs sm:text-sm"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isStreaming || !input.trim()}
            className="shrink-0 rounded-lg h-9 w-9 bg-primary hover:bg-primary/90 text-primary-foreground"
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
