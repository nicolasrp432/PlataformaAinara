"use client"

import { useState, useEffect } from "react"
import { ReflectionForm } from "./reflection-form"
import { ResonanceButton } from "./resonance-button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Share2 } from "lucide-react"

function formatTimeAgo(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diffInSeconds < 60) return "Hace un momento"
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `Hace ${diffInMinutes}m`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `Hace ${diffInHours}h`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) return `Hace ${diffInDays}d`
  return date.toLocaleDateString("es-ES", { month: "short", day: "numeric" })
}

interface TabernaFeedProps {
  initialReflections: any[]
  currentUser: { full_name: string; avatarUrl: string | null }
}

export function TabernaFeed({ initialReflections, currentUser }: TabernaFeedProps) {
  const [reflections, setReflections] = useState(initialReflections)

  // Sync when server sends updated data after router.refresh()
  useEffect(() => {
    setReflections(initialReflections)
  }, [initialReflections])

  const handleOptimisticReflection = (reflection: any) => {
    setReflections((prev) => [reflection, ...prev])
  }

  return (
    <>
      <ReflectionForm user={currentUser} onOptimisticReflection={handleOptimisticReflection} />

      <div className="space-y-6">
        <h2 className="text-xl font-medium tracking-tight border-b border-border/50 pb-2">
          Últimas Voces
        </h2>

        {reflections.length === 0 ? (
          <div className="text-center py-12 px-4 border border-dashed border-border/50 rounded-xl bg-card/20 backdrop-blur-sm">
            <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <h3 className="text-lg font-medium text-foreground">El silencio reina...</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">
              Sé el primero en romper el hielo compartiendo tu visión del mundo.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {reflections.map((reflection: any) => {
              const authorProfile = Array.isArray(reflection.profiles)
                ? reflection.profiles[0]
                : reflection.profiles
              const authorName = authorProfile?.full_name || "Usuario Anónimo"
              const authorAvatar = authorProfile?.avatar_url || ""
              const isAuthorAdmin = authorProfile?.role === "admin"
              const isTemp = reflection.id?.startsWith("temp-")

              return (
                <Card
                  key={reflection.id}
                  className={`border-border/60 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden group transition-all duration-300 ${
                    isTemp ? "opacity-70 animate-pulse" : "hover:bg-card/60"
                  }`}
                >
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex gap-4">
                      <Avatar className="h-10 w-10 shrink-0 border border-border/50 mt-1">
                        <AvatarImage src={authorAvatar} className="object-cover" />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {authorName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1 text-sm">
                          <div className="flex items-center gap-2 truncate pr-2">
                            <span className="font-semibold text-foreground truncate">{authorName}</span>
                            {isAuthorAdmin && (
                              <Badge
                                variant="secondary"
                                className="bg-primary/15 text-primary border-none cursor-default py-0 px-2 h-5 text-[10px] uppercase font-bold tracking-wider"
                              >
                                Fundador
                              </Badge>
                            )}
                            <span className="text-muted-foreground text-xs hidden sm:inline">
                              &bull; {formatTimeAgo(reflection.created_at)}
                            </span>
                          </div>
                          <span className="text-muted-foreground text-xs sm:hidden">
                            {formatTimeAgo(reflection.created_at)}
                          </span>
                        </div>

                        {(reflection as any).lessons && (
                          <div className="mb-3">
                            <Badge
                              variant="secondary"
                              className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
                            >
                              Comentado en: {(reflection as any).lessons.title}
                            </Badge>
                          </div>
                        )}

                        <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                          {reflection.content}
                        </p>

                        {!isTemp && (
                          <div className="flex items-center gap-6 mt-4 pt-3 border-t border-border/30">
                            <ResonanceButton
                              reflectionId={reflection.id}
                              initialCount={(reflection as any).likes_count || 0}
                            />
                            <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
                              <MessageCircle className="w-4 h-4" />
                              <span>Debatir</span>
                            </button>
                            <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors ml-auto sm:ml-0">
                              <Share2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
