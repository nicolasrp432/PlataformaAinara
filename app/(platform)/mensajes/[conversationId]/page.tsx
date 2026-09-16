import { redirect } from "next/navigation"

interface PageProps {
  params: Promise<{ conversationId: string }>
}

export default async function MensajesConversationPage({ params }: PageProps) {
  const { conversationId } = await params
  redirect(`/messages/${conversationId}`)
}
