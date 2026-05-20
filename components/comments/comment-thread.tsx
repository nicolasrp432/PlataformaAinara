"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Reply, Send, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { ReactionBar, type ReactionState } from "./reaction-bar"
import { addCommentReply, deleteComment } from "@/app/(platform)/learn/[slug]/[lessonId]/actions"

export interface ThreadedComment {
  id: string
  content: string
  created_at: string
  user_id: string
  parent_id: string | null
  profiles: {
    id: string
    full_name: string | null
    avatar_url: string | null
  } | null
  reactions: ReactionState
  replies: ThreadedComment[]
}

interface CommentThreadProps {
  comments: ThreadedComment[]
  currentUserId: string
  lessonId: string
  slug: string
}

function formatRelative(dateString: string): string {
  const date = new Date(dateString)
  const diff = Date.now() - date.getTime()
  const min = 60_000, hour = 60 * min, day = 24 * hour
  if (diff < min) return "Ahora"
  if (diff < hour) return `Hace ${Math.floor(diff / min)} min`
  if (diff < day) return `Hace ${Math.floor(diff / hour)} h`
  if (diff < 7 * day) return `Hace ${Math.floor(diff / day)} d`
  return date.toLocaleDateString("es-ES", { month: "short", day: "numeric" })
}

export function CommentThread({ comments, currentUserId, lessonId, slug }: CommentThreadProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-10 opacity-50 border border-dashed border-border/50 rounded-xl">
        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
        <p>Aún no hay reflexiones en esta lección.</p>
        <p className="text-xs mt-1">Sé la primera persona en comentar.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {comments.map((c) => (
        <CommentItem
          key={c.id}
          comment={c}
          currentUserId={currentUserId}
          lessonId={lessonId}
          slug={slug}
          isReply={false}
        />
      ))}
    </div>
  )
}

interface CommentItemProps {
  comment: ThreadedComment
  currentUserId: string
  lessonId: string
  slug: string
  isReply: boolean
}

function CommentItem({ comment, currentUserId, lessonId, slug, isReply }: CommentItemProps) {
  const router = useRouter()
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [isReplying, startReplyTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()
  const isOwn = comment.user_id === currentUserId
  const isTemp = comment.id?.startsWith("temp-")

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = replyText.trim()
    if (!trimmed) return

    startReplyTransition(async () => {
      const result = await addCommentReply(comment.id, trimmed, lessonId, slug)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      setReplyText("")
      setShowReply(false)
      router.refresh()
    })
  }

  const handleDelete = () => {
    if (!window.confirm("¿Eliminar este comentario? Esta acción no se puede deshacer.")) return
    startDeleteTransition(async () => {
      const result = await deleteComment(comment.id, lessonId, slug)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      toast.success("Comentario eliminado.")
      router.refresh()
    })
  }

  return (
    <div className={cn("flex gap-3", isReply && "ml-10 sm:ml-12", isTemp && "opacity-60")}>
      <Avatar className={cn("border border-border shrink-0", isReply ? "w-8 h-8" : "w-10 h-10")}>
        <AvatarImage src={comment.profiles?.avatar_url || undefined} />
        <AvatarFallback className="bg-muted text-xs">
          {comment.profiles?.full_name?.charAt(0).toUpperCase() || (isOwn ? "TÚ" : "U")}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="bg-muted/30 p-3.5 sm:p-4 rounded-2xl rounded-tl-none border border-border/30">
          <div className="flex items-center justify-between gap-2 mb-1">
            <Link
              href={`/u/${comment.user_id}`}
              className="font-semibold text-sm truncate hover:text-primary transition-colors"
            >
              {comment.profiles?.full_name || (isOwn ? "Tú" : "Usuario")}
            </Link>
            <span className="text-xs text-muted-foreground shrink-0">
              {isTemp ? "Enviando..." : formatRelative(comment.created_at)}
            </span>
          </div>
          <p className="text-foreground/90 text-sm leading-relaxed whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        </div>

        {/* Actions row: reactions + reply + delete */}
        {!isTemp && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
            <ReactionBar
              reflectionId={comment.id}
              reactions={comment.reactions}
              lessonId={lessonId}
              slug={slug}
            />
            {!isReply && (
              <button
                type="button"
                onClick={() => setShowReply((s) => !s)}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                <Reply className="w-3.5 h-3.5" />
                {showReply ? "Cancelar" : "Responder"}
              </button>
            )}
            {isOwn && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </button>
            )}
          </div>
        )}

        {/* Reply form */}
        {showReply && !isReply && (
          <form onSubmit={handleReplySubmit} className="mt-3 flex gap-3">
            <div className="w-8 shrink-0" />
            <div className="flex-1 space-y-2">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Responder a ${comment.profiles?.full_name || "este comentario"}...`}
                rows={2}
                disabled={isReplying}
                className="resize-none bg-background border-border/60 focus-visible:ring-1 focus-visible:ring-primary/30 text-sm"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowReply(false); setReplyText("") }}
                  disabled={isReplying}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isReplying || !replyText.trim()}
                  className="rounded-full"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  {isReplying ? "Enviando..." : "Responder"}
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Nested replies (1 level) */}
        {comment.replies.length > 0 && (
          <div className="mt-4 space-y-4 border-l-2 border-border/30 pl-3">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                lessonId={lessonId}
                slug={slug}
                isReply
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
