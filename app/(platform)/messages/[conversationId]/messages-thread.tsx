"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Loader2, Send, MessageCircle } from "lucide-react"
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
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function MessagesThread({
  conversationId,
  currentUserId,
  otherUser,
  initialMessages,
}: MessagesThreadProps) {
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
          const raw = payload.new as {
            id: string
            sender_id: string
            body: string
            created_at: string
          }
          if (raw.sender_id === currentUserId) return // ya añadido optimísticamente

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

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, currentUserId])

  const handleSend = async () => {
    const trimmed = body.trim()
    if (!trimmed || isPending) return

    const optimisticId = `opt-${Date.now()}`
    const optimistic: Message = {
      id: optimisticId,
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

    try {
      const result = await sendMessageAction(conversationId, formData)
      if (result?.error) {
        toast.error(result.error)
        // Restaurar borrador y quitar mensaje optimista
        setBody(trimmed)
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
      }
    } catch {
      toast.error("Error al enviar el mensaje. Inténtalo de nuevo.")
      setBody(trimmed)
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
    } finally {
      setIsPending(false)
      textareaRef.current?.focus()
    }
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
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/85 backdrop-blur-md shrink-0 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push("/messages")}
            className="text-muted-foreground hover:text-foreground shrink-0 rounded-lg"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          {otherUser ? (
            <Link
              href={`/u/${otherUser.id}`}
              className="flex items-center gap-2.5 min-w-0 group hover:opacity-85 transition-opacity"
              title="Ver perfil de este explorador"
            >
              <Avatar className="h-8 w-8 shrink-0 ring-1 ring-border group-hover:ring-primary/40 transition-colors">
                <AvatarImage src={otherUser.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                  {getInitials(otherUser.full_name ?? "?")}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <span className="text-sm font-semibold truncate block group-hover:text-primary transition-colors leading-tight">
                  {otherUser.full_name ?? "Conversación"}
                </span>
                <span className="text-3xs text-muted-foreground block leading-tight">
                  Ver perfil cósmico
                </span>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-2.5">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs">?</AvatarFallback>
              </Avatar>
              <span className="text-sm font-semibold">Conversación</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Mensajes ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3.5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-muted-foreground space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Conversación con {otherUser?.full_name ?? "este explorador"}
              </p>
              <p className="text-xs max-w-sm mt-1 text-muted-foreground/80">
                Este es el inicio de vuestra conversación privada. Escribe un mensaje abajo para conectar.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isOwn = msg.sender_id === currentUserId
          return (
            <div
              key={msg.id}
              className={cn("flex gap-2.5", isOwn ? "flex-row-reverse" : "flex-row")}
            >
              {!isOwn && (
                <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                  <AvatarImage src={msg.profiles?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-3xs bg-primary/10 text-primary">
                    {getInitials(msg.profiles?.full_name ?? otherUser?.full_name ?? "?")}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className={cn("max-w-[78%]", isOwn && "items-end flex flex-col")}>
                <div
                  className={cn(
                    "px-4 py-2.5 text-sm leading-relaxed shadow-xs",
                    isOwn
                      ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-xs"
                      : "bg-muted/70 text-foreground border border-border/40 rounded-2xl rounded-tl-xs"
                  )}
                >
                  {msg.body}
                </div>
                <span className="mt-1 text-3xs text-muted-foreground px-1 font-medium">
                  {formatTime(msg.created_at)}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ─────────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-t border-border bg-card/85 backdrop-blur-md shrink-0 shadow-xs">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Escribe un mensaje… (Enter para enviar, Shift+Enter para salto)"
            maxLength={2000}
            className="flex-1 resize-none bg-background/70 border-border/70 text-sm min-h-[42px] max-h-32 rounded-lg px-3.5 py-2.5 focus-visible:ring-primary/20"
          />
          <Button
            type="button"
            size="icon"
            onClick={handleSend}
            disabled={!body.trim() || isPending}
            className="shrink-0 h-10 w-10 rounded-lg shadow-sm font-medium"
            title="Enviar mensaje"
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
