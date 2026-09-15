"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { startConversationAction } from "../../messages/actions"

export function SendMessageButton({ userId }: { userId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  const handleClick = () => {
    toast.loading("Abriendo conversación...", { id: "open-conv" })
    startTransition(async () => {
      const result = await startConversationAction(userId)
      if (result?.error) {
        toast.error(result.error, { id: "open-conv" })
        return
      }

      if (result?.conversationId) {
        toast.dismiss("open-conv")
        router.push(`/messages/${result.conversationId}`)
        router.refresh()
      }
    })
  }

  return (
    <Button
      type="button"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className="gap-2 w-full h-11 sm:h-9 text-sm shadow-md font-medium"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <MessageSquare className="h-4 w-4" />
      )}
      Enviar mensaje
    </Button>
  )
}
