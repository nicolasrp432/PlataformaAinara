import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getAuthUser } from "@/lib/data-access"
import { Bot } from "lucide-react"
import { ChatPanel } from "@/components/ai/chat-panel"

export const metadata: Metadata = {
  title: "Asistente IA",
  description: "Tu guía de aprendizaje inteligente.",
}

export default async function AssistantPage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  return (
    <div className="flex flex-col h-[calc(100svh-4rem)] max-w-3xl mx-auto px-4">
      <div className="py-5 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Asistente Mitra</h1>
            <p className="text-sm text-muted-foreground">
              Haz preguntas sobre tus formaciones y lecciones.
            </p>
          </div>
        </div>
      </div>

      <ChatPanel className="flex-1" />
    </div>
  )
}
