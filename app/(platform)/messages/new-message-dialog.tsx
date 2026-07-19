"use client"

import * as React from "react"
import { toast } from "sonner"
import { Loader2, PenSquare, Search, Users } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials, cn } from "@/lib/utils"
import { startConversationAction } from "./actions"

interface SearchResult {
  id: string
  full_name: string | null
  avatar_url: string | null
  level?: number
}

export function NewMessageDialog({ currentUserId }: { currentUserId: string }) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()
  const [pendingUserId, setPendingUserId] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) {
      setQuery("")
      setResults([])
      setPendingUserId(null)
    }
  }, [open])

  // Búsqueda con debounce sobre el endpoint existente
  React.useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(trimmed)}`)
        if (res.ok) {
          const data = await res.json()
          setResults(
            (data.users || []).filter((u: SearchResult) => u.id !== currentUserId)
          )
        }
      } catch {
        // silencioso: el estado vacío ya comunica que no hay resultados
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, currentUserId])

  const handleSelect = (userId: string) => {
    if (isPending) return
    setPendingUserId(userId)
    startTransition(async () => {
      const result = await startConversationAction(userId)
      // En éxito la acción redirige al hilo; si devuelve algo, es un error
      if (result?.error) {
        toast.error(result.error)
        setPendingUserId(null)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 shadow-md">
          <PenSquare className="h-3.5 w-3.5" />
          Nuevo mensaje
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo mensaje</DialogTitle>
          <DialogDescription>
            Busca a la persona con quien quieres conversar.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca por nombre..."
            className="pl-9"
            autoFocus
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
          )}
        </div>

        <div className="max-h-72 overflow-y-auto space-y-0.5 -mx-1 px-1">
          {!query.trim() && (
            <div className="text-center py-8 text-muted-foreground space-y-1">
              <Users className="h-8 w-8 mx-auto opacity-30 text-primary" />
              <p className="text-xs">
                Escribe un nombre para encontrar a otros exploradores.
              </p>
            </div>
          )}

          {query.trim() && !isSearching && results.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-xs">No se encontraron usuarios.</p>
            </div>
          )}

          {results.map((user) => {
            const isThisPending = isPending && pendingUserId === user.id
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => handleSelect(user.id)}
                disabled={isPending}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors",
                  "hover:bg-muted/50 disabled:opacity-60"
                )}
              >
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={user.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {getInitials(user.full_name || "?")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{user.full_name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Nivel {user.level || 1}
                  </p>
                </div>
                {isThisPending && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
