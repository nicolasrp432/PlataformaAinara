import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { listConversations } from "@/lib/services/messaging"
import { ConversationsInbox } from "./conversations-inbox"
import { MessageSquare, Sparkles } from "lucide-react"

export const metadata = { title: "Mensajes | Plataforma Ainara" }

export default async function MessagesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const conversations = await listConversations(user.id)

  return (
    <div className="messaging-workspace flex flex-col md:flex-row overflow-hidden max-w-7xl mx-auto ">
      {/* Columna Izquierda: Lista de conversaciones (en móvil ocupa toda la pantalla; en desktop 360px-400px) */}
      <div className="w-full md:w-[380px] lg:w-[420px] h-full shrink-0">
        <ConversationsInbox
          initialConversations={conversations}
          currentUserId={user.id}
        />
      </div>

      {/* Columna Derecha: Estado inicial vacío en escritorio (oculto en móvil hasta seleccionar un chat) */}
      <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 bg-background/50 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-radial from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-md space-y-4 relative z-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5">
            <MessageSquare className="h-8 w-8" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
              <span>Tus Conversaciones</span>
              <Sparkles className="h-4 w-4 text-primary" />
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Selecciona una conversación de la lista de la izquierda o inicia un nuevo chat con cualquier explorador de la comunidad.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-4 text-3xs text-muted-foreground/80 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Tiempo real instantáneo
            </span>
            <span>&bull;</span>
            <span>Privado y seguro</span>
          </div>
        </div>
      </div>
    </div>
  )
}
