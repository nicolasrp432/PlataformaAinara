"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Loader2,
  Send,
  MessageCircle,
  Check,
  CheckCheck,
  ChevronDown,
  Sparkles,
} from "lucide-react"
import {
  sendMessageAction,
  markConversationReadAction,
  getLatestMessagesAction,
} from "../actions"
import { playMessageChime } from "@/components/messages/audio-chime"
import { getInitials, cn } from "@/lib/utils"

export interface Message {
  id: string
  sender_id: string
  body: string
  created_at: string
  profiles: { id: string; full_name: string; avatar_url: string | null } | null
}

interface MessagesThreadProps {
  conversationId: string
  currentUserId: string
  otherUser: {
    id: string
    full_name: string
    avatar_url: string | null
    last_read_at?: string | null
  } | null
  initialMessages: Message[]
}

const QUICK_EMOJIS = ["✨", "🙏", "💛", "💡", "🔥", "👍"]
const ICEBREAKERS = [
  "¡Hola! ¿Cómo estás? 👋",
  "Me gustó tu reflexión en La Taberna ✨",
  "¿Qué tal vas con las formaciones? 📚",
]

function formatMessageTime(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return ""
  }
}

function formatDateSeparator(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()

  if (isToday) return "Hoy"

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()

  if (isYesterday) return "Ayer"

  return d.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "long",
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
  const [otherLastRead, setOtherLastRead] = React.useState<string | null>(
    otherUser?.last_read_at ?? null
  )
  const [isOtherTyping, setIsOtherTyping] = React.useState(false)
  const [showScrollBottom, setShowScrollBottom] = React.useState(false)

  const scrollAreaRef = React.useRef<HTMLDivElement>(null)
  const bottomRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const lastTypingBroadcastRef = React.useRef<number>(0)
  const channelRef = React.useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(
    null
  )

  // Desplazamiento automático al fondo
  const scrollToBottom = React.useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior })
  }, [])

  // Desplazarse al cargar
  React.useEffect(() => {
    scrollToBottom("auto")
  }, [scrollToBottom])

  // Detectar si el usuario ha hecho scroll hacia arriba
  const handleScroll = () => {
    if (!scrollAreaRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current
    const distanceToBottom = scrollHeight - scrollTop - clientHeight
    setShowScrollBottom(distanceToBottom > 200)
  }

  // ── Multi-Transport Realtime Engine ──────────────────────────────────────
  React.useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel(`chat:${conversationId}`, {
      config: { broadcast: { self: false } },
    })

    channelRef.current = channel

    // 1. Transporte Broadcast Instantáneo: Mensaje nuevo
    channel.on("broadcast", { event: "new_message" }, (event) => {
      const newMsg = event.payload as Message
      if (newMsg.sender_id === currentUserId) return

      playMessageChime()
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev
        return [...prev, newMsg]
      })

      // Marcar como leído
      markConversationReadAction(conversationId)
      scrollToBottom("smooth")
    })

    // 2. Transporte Broadcast: Indicador de escritura
    channel.on("broadcast", { event: "typing" }, (event) => {
      const payload = event.payload as { userId: string }
      if (payload.userId !== currentUserId) {
        setIsOtherTyping(true)
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
          setIsOtherTyping(false)
        }, 3000)
      }
    })

    // 3. Transporte Broadcast: Recibo de lectura
    channel.on("broadcast", { event: "read" }, (event) => {
      const payload = event.payload as { readAt: string; userId: string }
      if (payload.userId !== currentUserId) {
        setOtherLastRead(payload.readAt)
      }
    })

    // 4. Transporte Postgres Changes (respaldo de persistencia en base de datos)
    channel.on(
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
          conversation_id: string
          sender_id: string
          body: string
          created_at: string
        }
        if (raw.sender_id === currentUserId) return

        setMessages((prev) => {
          if (prev.some((m) => m.id === raw.id)) return prev
          const msgWithProfile: Message = {
            ...raw,
            profiles: otherUser
              ? {
                  id: otherUser.id,
                  full_name: otherUser.full_name,
                  avatar_url: otherUser.avatar_url,
                }
              : null,
          }
          return [...prev, msgWithProfile]
        })
        scrollToBottom("smooth")
      }
    )

    channel.subscribe()

    // 5. Smart Polling & Tab Focus Synchronization
    const syncLatest = async () => {
      if (messages.length === 0) return
      const lastMsg = messages[messages.length - 1]
      const res = await getLatestMessagesAction(conversationId, lastMsg.created_at)
      if (res?.messages && res.messages.length > 0) {
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id))
          const missing = (res.messages as unknown as Message[]).filter((m) => !ids.has(m.id))
          if (missing.length === 0) return prev
          return [...prev, ...missing]
        })
        scrollToBottom("smooth")
      }
    }

    const handleFocus = () => {
      syncLatest()
      markConversationReadAction(conversationId)
    }

    window.addEventListener("focus", handleFocus)
    document.addEventListener("visibilitychange", handleFocus)

    // Sondeo de respaldo cada 5 segundos si la ventana está activa
    const pollInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        syncLatest()
      }
    }, 5000)

    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener("focus", handleFocus)
      document.removeEventListener("visibilitychange", handleFocus)
      clearInterval(pollInterval)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [conversationId, currentUserId, otherUser, messages, scrollToBottom])

  // Difundir evento de escritura
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBody(e.target.value)

    const now = Date.now()
    if (now - lastTypingBroadcastRef.current > 1500) {
      lastTypingBroadcastRef.current = now
      channelRef.current?.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: currentUserId },
      })
    }
  }

  // Enviar mensaje
  const handleSendText = async (textToSend: string) => {
    const trimmed = textToSend.trim()
    if (!trimmed || isPending) return

    const optimisticId = `opt-${Date.now()}`
    const nowIso = new Date().toISOString()
    const optimisticMessage: Message = {
      id: optimisticId,
      sender_id: currentUserId,
      body: trimmed,
      created_at: nowIso,
      profiles: null,
    }

    setMessages((prev) => [...prev, optimisticMessage])
    setBody("")
    setIsPending(true)
    scrollToBottom("smooth")

    const formData = new FormData()
    formData.set("body", trimmed)

    try {
      const result = await sendMessageAction(conversationId, formData)

      if (result?.error) {
        toast.error(result.error)
        setBody(trimmed)
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
        return
      }

      if (result?.message) {
        const confirmed = result.message as Message
        // Reemplazar optimista con mensaje confirmado por el servidor
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticId ? confirmed : m))
        )

        // Difundir broadcast instantáneo a la sala de chat
        channelRef.current?.send({
          type: "broadcast",
          event: "new_message",
          payload: confirmed,
        })
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
      handleSendText(body)
    }
  }

  const handleQuickEmoji = (emoji: string) => {
    setBody((prev) => prev + emoji)
    textareaRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-full w-full bg-background/60 backdrop-blur-md overflow-hidden relative">
      {/* ── Header del hilo ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/70 bg-card/85 backdrop-blur-md shrink-0 shadow-xs z-10">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push("/messages")}
            className="md:hidden text-muted-foreground hover:text-foreground shrink-0 rounded-lg -ml-1"
            aria-label="Volver a la lista de mensajes"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          {otherUser ? (
            <Link
              href={`/u/${otherUser.id}`}
              className="flex items-center gap-3 min-w-0 group hover:opacity-90 transition-opacity"
              title="Ver perfil de este explorador"
            >
              <div className="relative shrink-0">
                <Avatar className="h-9 w-9 ring-1 ring-border group-hover:ring-primary/40 transition-colors">
                  <AvatarImage src={otherUser.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                    {getInitials(otherUser.full_name ?? "?")}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-bold truncate block group-hover:text-primary transition-colors leading-tight text-foreground">
                  {otherUser.full_name}
                </span>
                <span className="text-3xs text-muted-foreground block leading-tight flex items-center gap-1 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>En línea · Ver perfil</span>
                </span>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-2.5">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="text-xs bg-muted">?</AvatarFallback>
              </Avatar>
              <span className="text-sm font-bold">Conversación</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Lista de mensajes ───────────────────────────────────────────── */}
      <div
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center text-muted-foreground space-y-4">
            <div className="h-14 w-14 rounded-3xl bg-primary/10 text-primary flex items-center justify-center shadow-inner border border-primary/20">
              <MessageCircle className="h-7 w-7" />
            </div>
            <div className="max-w-sm">
              <p className="text-sm font-bold text-foreground">
                Inicia una conversación con {otherUser?.full_name ?? "este explorador"}
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Este es un espacio seguro y privado para conectar, compartir reflexiones e intercambiar experiencias.
              </p>
            </div>

            {/* Sugerencias de apertura */}
            <div className="pt-2 w-full max-w-sm space-y-2">
              <p className="text-3xs font-semibold text-muted-foreground/80 uppercase tracking-wider text-left pl-1">
                Rompehielos sugeridos:
              </p>
              <div className="flex flex-col gap-1.5">
                {ICEBREAKERS.map((text, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendText(text)}
                    className="w-full text-left text-xs px-3.5 py-2 rounded-xl bg-card hover:bg-primary/10 border border-border/50 hover:border-primary/30 text-foreground/90 hover:text-primary transition-colors shadow-2xs flex items-center justify-between group"
                  >
                    <span>{text}</span>
                    <Sparkles className="h-3 w-3 opacity-0 group-hover:opacity-100 text-primary transition-opacity shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Agrupación de mensajes con separadores de fecha */}
        {messages.map((msg, index) => {
          const isOwn = msg.sender_id === currentUserId
          const prevMsg = messages[index - 1]
          const isFirstOfDay =
            !prevMsg ||
            new Date(prevMsg.created_at).toDateString() !==
              new Date(msg.created_at).toDateString()

          // Determinar estado de lectura para mensajes propios
          const isRead =
            isOwn &&
            otherLastRead &&
            new Date(otherLastRead).getTime() >= new Date(msg.created_at).getTime()

          return (
            <React.Fragment key={msg.id}>
              {isFirstOfDay && (
                <div className="flex justify-center my-3">
                  <span className="text-3xs px-3 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border/40 font-medium shadow-2xs">
                    {formatDateSeparator(msg.created_at)}
                  </span>
                </div>
              )}

              <div
                className={cn(
                  "flex gap-2.5 items-end",
                  isOwn ? "flex-row-reverse" : "flex-row"
                )}
              >
                {!isOwn && (
                  <Avatar className="h-7 w-7 shrink-0 ring-1 ring-border/50 mb-0.5">
                    <AvatarImage src={msg.profiles?.avatar_url ?? otherUser?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-3xs bg-primary/10 text-primary font-semibold">
                      {getInitials(msg.profiles?.full_name ?? otherUser?.full_name ?? "?")}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={cn(
                    "max-w-[82%] sm:max-w-[70%] group flex flex-col",
                    isOwn ? "items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "px-4 py-2.5 text-sm leading-relaxed shadow-xs relative break-words select-text",
                      isOwn
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-br-xs font-normal"
                        : "bg-card/90 text-foreground border border-border/60 rounded-2xl rounded-bl-xs"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.body}</p>
                  </div>

                  {/* Metadatos: Hora y Doble Check */}
                  <div
                    className={cn(
                      "flex items-center gap-1 mt-1 px-1 text-3xs font-medium",
                      isOwn ? "text-muted-foreground" : "text-muted-foreground/80"
                    )}
                  >
                    <span>{formatMessageTime(msg.created_at)}</span>
                    {isOwn && (
                      <span
                        title={isRead ? "Leído" : "Enviado"}
                        className={cn(
                          "inline-flex items-center",
                          isRead ? "text-primary font-bold" : "text-muted-foreground/60"
                        )}
                      >
                        {isRead ? (
                          <CheckCheck className="h-3.5 w-3.5" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </React.Fragment>
          )
        })}

        {/* Indicador de escritura */}
        {isOtherTyping && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-2 pt-1 animate-fadeIn">
            <Avatar className="h-5 w-5 shrink-0 ring-1 ring-border">
              <AvatarImage src={otherUser?.avatar_url ?? undefined} />
              <AvatarFallback className="text-3xs">
                {getInitials(otherUser?.full_name ?? "?")}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 border border-border/40 text-3xs font-medium">
              <span>{otherUser?.full_name?.split(" ")[0]} está escribiendo</span>
              <span className="flex gap-0.5">
                <span className="h-1 w-1 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                <span className="h-1 w-1 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                <span className="h-1 w-1 rounded-full bg-primary animate-bounce" />
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Botón flotante para saltar al fondo si hay scroll */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom("smooth")}
          className="absolute bottom-24 right-6 h-9 w-9 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all z-20"
          aria-label="Ir al último mensaje"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      )}

      {/* ── Input bar de lujo ────────────────────────────────────────────── */}
      <div className="p-3 sm:p-4 border-t border-border/70 bg-card/85 backdrop-blur-md shrink-0 shadow-xs space-y-2">
        {/* Barra de emojis rápidos */}
        <div className="flex items-center gap-1 px-1 overflow-x-auto no-scrollbar">
          <span className="text-3xs text-muted-foreground/70 mr-1 font-medium hidden sm:inline">
            Reacción rápida:
          </span>
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleQuickEmoji(emoji)}
              className="text-sm px-2 py-0.5 rounded-lg hover:bg-muted/60 transition-colors active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Caja de redacción con botón de envío */}
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={body}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Escribe un mensaje… (Enter para enviar, Shift+Enter para salto)"
            maxLength={2000}
            className="flex-1 resize-none bg-background/70 border-border/70 text-sm min-h-[44px] max-h-32 rounded-xl px-3.5 py-2.5 focus-visible:ring-primary/20 leading-relaxed"
          />
          <Button
            type="button"
            size="icon"
            onClick={() => handleSendText(body)}
            disabled={!body.trim() || isPending}
            className="shrink-0 h-11 w-11 rounded-xl shadow-md font-medium gold-gradient"
            title="Enviar mensaje (Enter)"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
            ) : (
              <Send className="h-4 w-4 text-primary-foreground" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
