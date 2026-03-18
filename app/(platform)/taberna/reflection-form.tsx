"use client"

import { useState, useTransition } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Send } from "lucide-react"
import { createReflection } from "./actions"

interface ReflectionFormProps {
  user: {
    name: string
    avatarUrl: string | null
  }
}

export function ReflectionForm({ user }: ReflectionFormProps) {
  const [isPending, startTransition] = useTransition()
  const [content, setContent] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!content.trim()) return

    setError(null)
    const formData = new FormData()
    formData.append("content", content)

    startTransition(async () => {
      try {
        const result = await createReflection(formData)
        if (result.error) {
          setError(result.error)
        } else {
          setContent("") // Clear form on success
        }
      } catch (err) {
        setError("Ocurrió un error al enviar tu publicación.")
      }
    })
  }

  return (
    <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-sm overflow-hidden mb-8">
      <CardContent className="p-4 sm:p-6">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-4">
            <Avatar className="h-10 w-10 shrink-0 border border-border/50 hidden sm:block">
              <AvatarImage src={user.avatarUrl || ""} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="Comparte tus aprendizajes, dudas o reflexiones con la comunidad..."
                className="min-h-[100px] resize-none bg-background/50 focus-visible:ring-primary/50 text-base"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isPending}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Tus reflexiones inspiran a otros aprendices.
                </p>
                <div className="w-full sm:w-auto flex justify-end">
                    <Button 
                    type="submit" 
                    disabled={isPending || !content.trim()} 
                    className="bg-primary hover:bg-primary/90 rounded-full px-6 font-medium shadow-sm transition-all shadow-primary/20 w-full sm:w-auto"
                    >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    Publicar
                    </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
