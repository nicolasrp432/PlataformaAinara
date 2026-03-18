import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ReflectionForm } from "./reflection-form"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, Share2 } from "lucide-react"

export const metadata: Metadata = {
  title: "La Taberna | Ainara",
  description: "Comparte y conecta con otros aprendices en la plataforma.",
}

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
  
  return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
}

export default async function TabernaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single()

  const currentUser = {
    name: user.user_metadata?.full_name || profile?.full_name || "Aventurero",
    avatarUrl: user.user_metadata?.avatar_url || profile?.avatar_url || "",
  }

  // Obtenemos las reflexiones uniendo la tabla profiles basada en foreign key.
  const { data: reflections } = await supabase
    .from("reflections")
    .select("*, profiles:user_id(full_name, avatar_url, role), lessons:lesson_id(title)")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10 relative">
      {/* Dynamic Header */}
      <div className="flex flex-col gap-2 relative z-10 mb-8">
        <h1 className="text-3xl font-light tracking-tight text-foreground sm:text-4xl">
          La <span className="font-semibold text-primary">Taberna</span>
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-xl">
          Un espacio sagrado para el debate, la reflexión e inspiración cruzada. Comparte lo que arde en tu mente y lee a otros exploradores.
        </p>
      </div>

      <ReflectionForm user={currentUser} />

      <div className="space-y-6">
        <h2 className="text-xl font-medium tracking-tight border-b border-border/50 pb-2">Últimas Voces</h2>
        
        {!reflections || reflections.length === 0 ? (
           <div className="text-center py-12 px-4 border border-dashed border-border/50 rounded-xl bg-card/20 backdrop-blur-sm">
             <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
             <h3 className="text-lg font-medium text-foreground">El silencio reina...</h3>
             <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">Sé el primero en romper el hielo compartiendo tu visión del mundo.</p>
           </div>
        ) : (
          <div className="flex flex-col gap-5">
            {reflections.map((reflection: any) => {
               // Procesamos perfil por si viene en un array debido a join config
               const authorProfile = Array.isArray(reflection.profiles) ? reflection.profiles[0] : reflection.profiles
               
               const authorName = authorProfile?.full_name || "Usuario Anónimo"
               const authorAvatar = authorProfile?.avatar_url || ""
               const isAuthorAdmin = authorProfile?.role === "admin"

               return (
                 <Card key={reflection.id} className="border-border/60 bg-card/40 backdrop-blur-sm hover:bg-card/60 transition-colors shadow-sm overflow-hidden group">
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
                               <Badge variant="secondary" className="bg-primary/15 text-primary border-none cursor-default py-0 px-2 h-5 text-[10px] uppercase font-bold tracking-wider">
                                 Fundador
                               </Badge>
                             )}
                             <span className="text-muted-foreground text-xs hidden sm:inline">&bull; {formatTimeAgo(reflection.created_at)}</span>
                           </div>
                           <span className="text-muted-foreground text-xs sm:hidden">{formatTimeAgo(reflection.created_at)}</span>
                         </div>
                  
                  {/* Etiqueta de lección si este comentario proviene de una clase */}
                  {(reflection as any).lessons && (
                    <div className="mb-3">
                      <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                        Comentado en: {(reflection as any).lessons.title}
                      </Badge>
                    </div>
                  )}

                  <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {reflection.content}
                         </p>

                         {/* Acciones base del muro de reflexiones */}
                         <div className="flex items-center gap-6 mt-4 pt-3 border-t border-border/30">
                           <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-orange-500 transition-colors group/btn">
                             <Heart className="w-4 h-4 fill-transparent group-hover/btn:fill-orange-500/20" />
                             <span>Resonar</span>
                           </button>
                           <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
                             <MessageCircle className="w-4 h-4" />
                             <span>Debatir</span>
                           </button>
                           <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors ml-auto sm:ml-0">
                             <Share2 className="w-4 h-4" />
                           </button>
                         </div>
                       </div>
                     </div>
                   </CardContent>
                 </Card>
               )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
