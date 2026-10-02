import { Metadata } from "next"
import { requireContentAccess } from "@/lib/guards"
import { PageHeader } from "@/components/layout/page-header"
import { ChatPanel } from "@/components/ai/chat-panel"

export const metadata: Metadata = {
  title: "Asistente IA Mitra",
  description: "Tu guía de aprendizaje inteligente y autoconocimiento.",
}

export default async function AssistantPage() {
  // Sesión + suscripción activa. Segunda capa junto al middleware.
  await requireContentAccess("/assistant")

  return (
    <div className="flex flex-col h-[calc(100dvh-12rem)] min-h-[28rem] md:h-[calc(100dvh-7rem)] max-w-3xl mx-auto px-2 sm:px-4">
      <div className="shrink-0 pb-4"><PageHeader eyebrow="Aprende a tu ritmo" title={<>Asistente <em>Mitra.</em></>} description="Aclara conceptos, conecta ideas y prepara tu próxima práctica." /></div>

      <ChatPanel className="flex-1 min-h-0" />
    </div>
  )
}
