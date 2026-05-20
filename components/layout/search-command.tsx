"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Search, BookOpen, Play, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchResult {
  type: "formation" | "lesson"
  id: string
  title: string
  subtitle?: string
  href: string
}

interface SearchCommandProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!open) {
      setQuery("")
      setResults([])
      setActiveIdx(0)
    }
  }, [open])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (abortRef.current) abortRef.current.abort()
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(() => {
      const ctrl = new AbortController()
      abortRef.current = ctrl
      fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((data) => {
          setResults(data.results ?? [])
          setActiveIdx(0)
        })
        .catch(() => { /* ignore aborts */ })
        .finally(() => setLoading(false))
    }, 200)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const navigate = (r: SearchResult) => {
    onOpenChange(false)
    router.push(r.href)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIdx((i) => (i + 1) % results.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIdx((i) => (i - 1 + results.length) % results.length)
    } else if (e.key === "Enter") {
      e.preventDefault()
      navigate(results[activeIdx])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden">
        <DialogTitle className="sr-only">Buscar en Sendero</DialogTitle>
        <DialogDescription className="sr-only">
          Encuentra formaciones y lecciones rápidamente.
        </DialogDescription>
        <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Busca formaciones, lecciones..."
            className="border-0 shadow-none focus-visible:ring-0 px-0 text-base h-9"
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Sin resultados para <span className="font-medium text-foreground">&ldquo;{query}&rdquo;</span>
            </div>
          )}

          {query.trim().length < 2 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Escribe al menos 2 caracteres para buscar.
            </div>
          )}

          {results.length > 0 && (
            <div className="py-2">
              {results.map((r, i) => {
                const Icon = r.type === "formation" ? BookOpen : Play
                return (
                  <button
                    key={`${r.type}-${r.id}`}
                    type="button"
                    onClick={() => navigate(r)}
                    onMouseEnter={() => setActiveIdx(i)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                      i === activeIdx ? "bg-muted" : "hover:bg-muted/50",
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      r.type === "formation" ? "bg-primary/10 text-primary" : "bg-blue-500/10 text-blue-600",
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                      {r.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
                      )}
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
                      {r.type === "formation" ? "Formación" : "Lección"}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="border-t border-border/50 px-4 py-2 flex items-center justify-between text-[11px] text-muted-foreground bg-muted/30">
          <span>↑↓ navegar · ↵ ir</span>
          <span>esc cerrar</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
