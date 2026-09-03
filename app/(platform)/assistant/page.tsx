import { Metadata } from "next"
import { requireMembership } from "@/lib/guards"
import { Bot, Sparkles } from "lucide-react"
import { ChatPanel } from "@/components/ai/chat-panel"

export const metadata: Metadata = {
  title: "Asistente IA Ainara",
  description: "Tu guía de aprendizaje inteligente y autoconocimiento.",
}

export default async function AssistantPage() {
  // Sesión + suscripción activa. Segunda capa junto al middleware.
  await requireMembership("/assistant")

  return (
    <div className="flex flex-col h-[calc(100svh-4.5rem)] max-w-3xl mx-auto px-2 sm:px-4">
      <div className="py-3.5 border-b border-border shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-1.5">
              Asistente Ainara
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </h1>
            <p className="text-xs text-muted-foreground">
              Guía personalizada para tus formaciones, reflexiones y dudas.
            </p>
          </div>
        </div>
      </div>

      <ChatPanel className="flex-1 min-h-0" />
    </div>
  )
}
