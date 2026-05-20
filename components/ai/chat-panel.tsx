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

export function ChatPanel({ lessonId, formationId, className }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">¿En qué puedo ayudarte?</p>
            <p className="text-sm mt-1 opacity-70">
              {lessonId
                ? "Haz preguntas sobre el contenido de esta lección."
                : "Haz preguntas sobre tus formaciones y lecciones."}
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3 items-start",
              msg.role === "user" ? "flex-row-reverse ml-8" : "mr-8",
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                msg.role === "user"
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-muted border-border text-muted-foreground",
              )}
            >
              {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div
              className={cn(
                "rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-muted text-foreground rounded-tl-sm",
              )}
            >
              {msg.content ? (
                <span className="whitespace-pre-wrap">{msg.content}</span>
              ) : (
                <span className="flex gap-1.5 items-center text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Pensando...
                </span>
              )}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/50 pt-3 pb-1">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu pregunta... (Enter para enviar, Shift+Enter nueva línea)"
            rows={1}
            disabled={isStreaming}
            className="resize-none min-h-[2.5rem] max-h-32 bg-muted/40 border-border/60 focus-visible:ring-1 focus-visible:ring-primary/30 text-sm"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isStreaming || !input.trim()}
            className="shrink-0 rounded-xl h-10 w-10"
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
