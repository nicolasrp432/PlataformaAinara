"use client"

import * as React from "react"
import { useTransition } from "react"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Trash2, MessageSquare } from "lucide-react"
import { addProfileCommentAction, deleteProfileCommentAction } from "./actions"
import { getInitials } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface ProfileComment {
  id: string
  content: string
  created_at: string
  author_id: string
  profiles: { id: string; full_name: string; avatar_url: string | null } | null
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

interface ProfileWallProps {
  profileId: string
  initialComments: ProfileComment[]
  currentUserId: string | null
}

export function ProfileWall({ profileId, initialComments, currentUserId }: ProfileWallProps) {
  const [comments, setComments] = React.useState(initialComments)
  const [isPending, startTransition] = useTransition()
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const form = e.currentTarget
    startTransition(async () => {
      const result = await addProfileCommentAction(profileId, formData)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      form.reset()
      // Refresca en background - el server action ya revalidate
      window.location.reload()
    })
  }

  const handleDelete = (commentId: string) => {
    startTransition(async () => {
      const result = await deleteProfileCommentAction(commentId, profileId)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Muro del perfil</h3>
        <span className="text-xs text-muted-foreground">({comments.length})</span>
      </div>

      {/* Formulario de comentario */}
      {currentUserId && (
        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            ref={textareaRef}
            name="content"
            rows={2}
            placeholder="Escribe algo en su muro…"
            maxLength={1000}
            required
            className="bg-background/50 border-border/50 text-sm resize-none"
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Comentar
            </Button>
          </div>
        </form>
      )}

      {/* Lista de comentarios */}
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Aún no hay comentarios en este perfil.
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={cn(
                "flex gap-3 p-3 rounded-lg border border-border/40 bg-card/50"
              )}
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={comment.profiles?.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs">
                  {getInitials(comment.profiles?.full_name ?? "?")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    {comment.profiles?.full_name ?? "Usuario"}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(comment.created_at)}
                    </span>
                    {currentUserId === comment.author_id && (
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        className="text-muted-foreground/50 hover:text-destructive transition-colors ml-1"
                        title="Eliminar"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-0.5 text-sm text-foreground/90 whitespace-pre-line">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
