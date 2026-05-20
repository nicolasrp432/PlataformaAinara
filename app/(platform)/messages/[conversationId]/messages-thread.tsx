"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Loader2, Send } from "lucide-react"
import { sendMessageAction } from "../actions"
import { getInitials, cn } from "@/lib/utils"

interface Message {
  id: string
  sender_id: string
  body: string
  created_at: string
  profiles: { id: string; full_name: string; avatar_url: string | null } | null
}

interface MessagesThreadProps {
  conversationId: string
  currentUserId: string
  otherUser: { id: string; full_name: string; avatar_url: string | null } | null
  initialMessages: Message[]
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("es-ES", {
    hour: "2-digit", minute: "2-digit",
  })
}

export function MessagesThread({ conversationId, currentUserId, otherUser, initialMessages }: MessagesThreadProps) {
  const router = useRouter()
  const [messages, setMessages] = React.useState<Message[]>(initialMessages)
  const [body, setBody] = React.useState("")
  const [isPending, setIsPending] = React.useState(false)
  const bottomRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Scroll al fondo al cargar y al recibir mensajes
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Realtime: escuchar nuevos mensajes en esta conversación
  React.useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const raw = payload.new as { id: string; sender_id: string; body: string; created_at: string }
          if (raw.sender_id === currentUserId) return // ya lo añadimos optimísticamente

          // Enriquecer con el perfil del sender
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .eq("id", raw.sender_id)
            .single()

          setMessages((prev) => [
            ...prev,
            { ...raw, profiles: profile ?? null },
          ])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId, currentUserId])

  const handleSend = async () => {
    const trimmed = body.trim()
    if (!trimmed || isPending) return

    // Inserción optimista
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      sender_id: currentUserId,
      body: trimmed,
      created_at: new Date().toISOString(),
      profiles: null,
    }
    setMessages((prev) => [...prev, optimistic])
    setBody("")
    setIsPending(true)

    const formData = new FormData()
    formData.set("body", trimmed)
    await sendMessageAction(conversationId, formData)
    setIsPending(false)
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-2xl mx-auto">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.push("/messages")}
          className="text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarImage src={otherUser?.avatar_url ?? undefined} />
          <AvatarFallback className="text-xs">
            {getInitials(otherUser?.full_name ?? "?")}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-semibold">
          {otherUser?.full_name ?? "Conversación"}
        </span>
      </div>

      {/* ── Mensajes ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            Inicia la conversación enviando un mensaje.
          </p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.sender_id === currentUserId
          return (
            <div
              key={msg.id}
              className={cn("flex gap-2", isOwn ? "flex-row-reverse" : "flex-row")}
            >
              {!isOwn && (
                <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                  <AvatarImage src={msg.profiles?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {getInitials(msg.profiles?.full_name ?? otherUser?.full_name ?? "?")}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className={cn("max-w-[75%]", isOwn && "items-end flex flex-col")}>
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    isOwn
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted text-foreground rounded-tl-sm"
                  )}
                >
                  {msg.body}
                </div>
                <span className="mt-0.5 text-[10px] text-muted-foreground px-1">
                  {formatTime(msg.created_at)}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ─────────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-t border-border bg-card/80 backdrop-blur-sm shrink-0">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Escribe un mensaje… (Enter para enviar)"
            maxLength={2000}
            className="flex-1 resize-none bg-background/50 border-border/50 text-sm min-h-[40px] max-h-32"
          />
          <Button
            type="button"
            size="icon"
            onClick={handleSend}
            disabled={!body.trim() || isPending}
            className="shrink-0 h-10 w-10"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
