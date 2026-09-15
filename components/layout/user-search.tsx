"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, Loader2, User, Star, MessageSquare, X, Sparkles, Lock } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getInitials, cn } from "@/lib/utils"
import { startConversationAction } from "@/app/(platform)/messages/actions"

interface SearchResult {
  id: string
  full_name: string | null
  avatar_url: string | null
  level?: number
  xp?: number
  role?: string
  allow_direct_messages?: boolean
}

interface UserSearchProps {
  /** "sidebar": barra completa con atajo ⌘K. "icon": solo lupa, para la barra superior móvil. */
  variant?: "sidebar" | "icon"
}

export function UserSearch({ variant = "sidebar" }: UserSearchProps = {}) {
  const router = useRouter()
  const [isOpen, setIsOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [isSuggested, setIsSuggested] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [messagingUserId, setMessagingUserId] = React.useState<string | null>(null)
  
  const inputRef = React.useRef<HTMLInputElement>(null)
  const resultsRef = React.useRef<HTMLDivElement>(null)
  const abortControllerRef = React.useRef<AbortController | null>(null)

  // Atajo de teclado global: ⌘K / Ctrl+K
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen((open) => !open)
      }
    }
    window.addEventListener("keydown", handleGlobalKeyDown)
    return () => window.removeEventListener("keydown", handleGlobalKeyDown)
  }, [])

  // Cargar sugerencias iniciales de la comunidad cuando se abre
  const fetchSuggestions = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/users/search")
      if (res.ok) {
        const data = await res.json()
        setResults(data.users || [])
        setIsSuggested(true)
        setSelectedIndex(0)
      }
    } catch {
      // Silencioso
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Auto-focus y carga al abrir
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80)
      setSelectedIndex(0)
      fetchSuggestions()
    } else {
      setQuery("")
      setResults([])
      setMessagingUserId(null)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [isOpen, fetchSuggestions])

  // Búsqueda con debounce y cancelación de peticiones anteriores (AbortController)
  React.useEffect(() => {
    const trimmed = query.trim()

    if (!trimmed) {
      if (isOpen) fetchSuggestions()
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        })
        if (res.ok) {
          const data = await res.json()
          setResults(data.users || [])
          setIsSuggested(false)
          setSelectedIndex(0)
        }
      } catch (err: unknown) {
        if ((err as Error)?.name !== "AbortError") {
          console.error("Error fetching search results:", err)
        }
      } finally {
        setIsLoading(false)
      }
    }, 250)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, isOpen, fetchSuggestions])

  // Navegación por teclado en la lista
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false)
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (results[selectedIndex]) {
        handleSelectUser(results[selectedIndex].id)
      }
    }
  }

  const handleSelectUser = (userId: string) => {
    setIsOpen(false)
    router.push(`/u/${userId}`)
  }

  // Acción directa: enviar mensaje desde el buscador
  const handleDirectMessage = async (e: React.MouseEvent, user: SearchResult) => {
    e.stopPropagation()

    if (user.allow_direct_messages === false) {
      toast.error("Este usuario no acepta mensajes directos")
      return
    }

    setMessagingUserId(user.id)
    toast.loading("Abriendo conversación...", { id: "search-open-chat" })

    try {
      const result = await startConversationAction(user.id)
      if (result?.error) {
        toast.error(result.error, { id: "search-open-chat" })
        setMessagingUserId(null)
      } else if (result?.conversationId) {
        toast.dismiss("search-open-chat")
        setIsOpen(false)
        router.push(`/messages/${result.conversationId}`)
        router.refresh()
      }
    } catch {
      toast.error("No se pudo iniciar la conversación", { id: "search-open-chat" })
      setMessagingUserId(null)
    }
  }

  const handleClear = () => {
    setQuery("")
    inputRef.current?.focus()
  }

  return (
    <>
      {/* Search trigger button */}
      {variant === "icon" ? (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Buscar exploradores"
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
            "text-muted-foreground hover:bg-muted/60 hover:text-foreground active:scale-95"
          )}
        >
          <Search className="h-5 w-5" />
        </button>
      ) : (
        <div className="px-3 mb-4">
          <button
            onClick={() => setIsOpen(true)}
            className={cn(
              "flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-all duration-200",
              "bg-muted/40 border border-border/50 hover:bg-muted/70 hover:border-primary/30",
              "text-muted-foreground hover:text-foreground group shadow-sm active:scale-[0.99]"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Search className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-xs font-medium">Buscar exploradores...</span>
            </div>
            <kbd className="pointer-events-none hidden select-none rounded border border-border/70 bg-card px-1.5 py-0.5 text-3xs font-mono font-medium text-muted-foreground/80 shadow-xs sm:inline-block">
              ⌘K
            </kbd>
          </button>
        </div>
      )}

      {/* Modal Dialog portal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-16 sm:pt-24">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Dialog panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className={cn(
                "relative w-full max-w-lg overflow-hidden rounded-2xl border border-primary/25 bg-card/95",
                "backdrop-blur-2xl shadow-2xl shadow-black/50 flex flex-col pt-3"
              )}
            >
              {/* Search bar inside dialog */}
              <div className="flex items-center gap-2.5 px-4 pb-3 border-b border-border/60">
                <Search className="h-4.5 w-4.5 text-primary shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  type="text"
                  placeholder="Busca exploradores por nombre..."
                  className="w-full bg-transparent border-none text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-0 py-1"
                />
                {isLoading && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                )}
                {query && !isLoading && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Search Results list */}
              <div
                ref={resultsRef}
                className="max-h-[380px] overflow-y-auto p-2 space-y-1"
              >
                {/* Categoría o estado */}
                {results.length > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 text-3xs font-bold text-muted-foreground/90 tracking-wider uppercase">
                    {isSuggested ? (
                      <>
                        <Sparkles className="h-3 w-3 text-primary" />
                        <span>Exploradores destacados</span>
                      </>
                    ) : (
                      <>
                        <User className="h-3 w-3 text-primary" />
                        <span>Resultados de búsqueda</span>
                      </>
                    )}
                  </div>
                )}

                {query.trim() && !isLoading && results.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground space-y-2">
                    <Search className="h-8 w-8 mx-auto opacity-30 text-primary" />
                    <p className="text-xs font-semibold">No se encontraron exploradores</p>
                    <p className="text-3xs opacity-70">Comprueba la ortografía o intenta con otro nombre.</p>
                  </div>
                )}

                {results.map((user, index) => {
                  const isSelected = selectedIndex === index
                  const isMessagingThisUser = messagingUserId === user.id
                  const allowsDirectMessages = user.allow_direct_messages !== false

                  return (
                    <div
                      key={user.id}
                      onClick={() => handleSelectUser(user.id)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        "group flex items-center justify-between gap-3 p-3 rounded-xl cursor-pointer transition-all duration-150",
                        isSelected 
                          ? "bg-primary/10 border border-primary/25 shadow-xs" 
                          : "border border-transparent hover:bg-muted/40"
                      )}
                    >
                      {/* Avatar e info de usuario */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar className={cn(
                          "h-10 w-10 shrink-0 border-2 transition-transform duration-200",
                          isSelected ? "border-primary/60 scale-105" : "border-background"
                        )}>
                          <AvatarImage src={user.avatar_url ?? undefined} alt={user.full_name ?? undefined} className="object-cover" />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                            {getInitials(user.full_name || "?")}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className={cn(
                              "text-sm font-semibold truncate leading-tight",
                              isSelected ? "text-primary" : "text-foreground"
                            )}>
                              {user.full_name}
                            </p>
                            {user.role === "mentor" && (
                              <Badge variant="secondary" className="text-3xs px-1.5 py-0 bg-primary/15 text-primary border-none font-medium">
                                Mentor
                              </Badge>
                            )}
                            {user.role === "admin" && (
                              <Badge variant="secondary" className="text-3xs px-1.5 py-0 bg-primary/15 text-primary border-none font-medium">
                                Admin
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-3xs text-muted-foreground font-medium">
                              Nivel {user.level || 1}
                            </span>
                            <span className="text-3xs text-muted-foreground/40">·</span>
                            <span className="text-3xs text-muted-foreground flex items-center gap-1 font-medium">
                              <Star className="h-2.5 w-2.5 text-primary fill-primary/30" />
                              {(user.xp || 0).toLocaleString()} XP
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Botón de acción directa: Enviar Mensaje */}
                      <div className="flex items-center gap-2 shrink-0">
                        {allowsDirectMessages ? (
                          <Button
                            type="button"
                            size="sm"
                            variant={isSelected ? "default" : "outline"}
                            disabled={isMessagingThisUser}
                            onClick={(e) => handleDirectMessage(e, user)}
                            className={cn(
                              "h-8 px-2.5 text-xs gap-1.5 rounded-lg shadow-xs transition-all font-medium",
                              isSelected
                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                : "border-border/60 hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                            )}
                            title="Enviar mensaje directo"
                          >
                            {isMessagingThisUser ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <MessageSquare className="h-3.5 w-3.5" />
                            )}
                            <span className="hidden sm:inline">Mensaje</span>
                          </Button>
                        ) : (
                          <span
                            className="flex items-center gap-1 text-3xs text-muted-foreground/60 px-2 py-1 rounded-md bg-muted/30"
                            title="No acepta mensajes directos"
                          >
                            <Lock className="h-3 w-3" />
                            <span className="hidden sm:inline">Privado</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Footer hint */}
              <div className="bg-muted/40 border-t border-border/50 px-4 py-2.5 flex items-center justify-between text-3xs text-muted-foreground shrink-0 rounded-b-2xl">
                <span className="flex items-center gap-1.5">
                  <span className="font-medium text-foreground/70">↑↓</span>
                  <span>navegar</span>
                  <span className="opacity-40">·</span>
                  <span className="font-medium text-foreground/70">Enter</span>
                  <span>ver perfil</span>
                </span>
                <span>ESC para cerrar</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
