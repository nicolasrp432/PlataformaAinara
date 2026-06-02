"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, Loader2, User, Star } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getInitials } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface SearchResult {
  id: string
  full_name: string | null
  avatar_url: string | null
  level?: number
  xp?: number
}

export function UserSearch() {
  const router = useRouter()
  const [isOpen, setIsOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  
  const inputRef = React.useRef<HTMLInputElement>(null)
  const resultsRef = React.useRef<HTMLDivElement>(null)

  // Listen for Ctrl+K / Cmd+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen((open) => !open)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Auto-focus input when open
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
      setSelectedIndex(0)
    } else {
      setQuery("")
      setResults([])
    }
  }, [isOpen])

  // Search logic (debounced)
  React.useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(trimmed)}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data.users || [])
          setSelectedIndex(0)
        }
      } catch (err) {
        console.error("Error fetching search results:", err)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Handle keyboard navigation in list
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

  return (
    <>
      {/* Search trigger button */}
      <div className="px-3 mb-4">
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-all",
            "bg-muted/40 border border-border/40 hover:bg-muted/70 hover:border-primary/20",
            "text-muted-foreground hover:text-foreground group shadow-inner"
          )}
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-xs font-medium">Buscar exploradores...</span>
          </div>
          <kbd className="pointer-events-none select-none rounded border border-border/60 bg-muted px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground/80 shadow-sm">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Modal Dialog portal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4">
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
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className={cn(
                "relative w-full max-w-lg overflow-hidden rounded-2xl border border-primary/20 bg-card/90",
                "backdrop-blur-2xl shadow-2xl shadow-black/40 flex flex-col pt-4"
              )}
            >
              {/* Search bar inside dialog */}
              <div className="flex items-center gap-3 px-4 pb-3 border-b border-border/50">
                <Search className="h-5 w-5 text-primary shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  type="text"
                  placeholder="Busca por nombre..."
                  className="w-full bg-transparent border-none text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-0 py-1"
                />
                {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />}
              </div>

              {/* Search Results list */}
              <div
                ref={resultsRef}
                className="max-h-[350px] overflow-y-auto p-2 space-y-0.5"
              >
                {!query.trim() && (
                  <div className="text-center py-12 text-muted-foreground space-y-1">
                    <User className="h-8 w-8 mx-auto opacity-30 text-primary" />
                    <p className="text-xs font-semibold">Busca exploradores de la comunidad</p>
                    <p className="text-[10px] opacity-60">Escribe el nombre de algún usuario para ver su perfil cósmico.</p>
                  </div>
                )}

                {query.trim() && !isLoading && results.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground space-y-1">
                    <Search className="h-8 w-8 mx-auto opacity-30 text-primary" />
                    <p className="text-xs font-semibold">No se encontraron resultados</p>
                    <p className="text-[10px] opacity-60">Prueba con otra palabra o verifica la ortografía.</p>
                  </div>
                )}

                {results.length > 0 && (
                  <div className="space-y-0.5">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground/80 tracking-widest uppercase">
                      Exploradores coincidentes
                    </div>
                    
                    {results.map((user, index) => {
                      const isSelected = selectedIndex === index
                      return (
                        <div
                          key={user.id}
                          onClick={() => handleSelectUser(user.id)}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={cn(
                            "flex items-center justify-between gap-3 p-3 rounded-xl cursor-pointer transition-all duration-150",
                            isSelected 
                              ? "bg-primary/10 border border-primary/20 shadow-sm" 
                              : "border border-transparent hover:bg-muted/40"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar className={cn(
                              "h-10 w-10 shrink-0 border-2 transition-transform duration-200",
                              isSelected ? "border-primary/50 scale-105" : "border-background"
                            )}>
                              <AvatarImage src={user.avatar_url ?? undefined} alt={user.full_name ?? undefined} className="object-cover" />
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                                {getInitials(user.full_name || "?")}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="min-w-0">
                              <p className={cn(
                                "text-sm font-semibold truncate leading-none mb-1",
                                isSelected ? "text-primary" : "text-foreground"
                              )}>
                                {user.full_name}
                              </p>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-muted-foreground font-medium">
                                  Nivel {user.level || 1}
                                </span>
                              </div>
                            </div>
                          </div>

                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-2 py-0.5 border-none font-bold gap-1 transition-colors duration-200",
                              isSelected 
                                ? "bg-primary/20 text-primary" 
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            <Star className="h-3 w-3 fill-current" />
                            {(user.xp || 0).toLocaleString()} XP
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Footer hint */}
              <div className="bg-muted/40 border-t border-border/50 px-4 py-2 flex items-center justify-between text-[10px] text-muted-foreground shrink-0 rounded-b-2xl">
                <span className="flex items-center gap-1">
                  <span>↑↓ para navegar</span>
                  <span className="opacity-40">·</span>
                  <span>Enter para abrir</span>
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
