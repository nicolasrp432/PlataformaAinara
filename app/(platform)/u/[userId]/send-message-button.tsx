"use client"

import * as React from "react"
import { toast } from "sonner"
import { Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { startConversationAction } from "../../messages/actions"

export function SendMessageButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = React.useTransition()

  const handleClick = () => {
    startTransition(async () => {
      const result = await startConversationAction(userId)
      // En éxito la acción redirige al hilo; si devuelve algo, es un error
      if (result?.error) toast.error(result.error)
    })
  }

  return (
    <Button
      type="button"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className="gap-2 w-full h-11 sm:h-9 text-sm shadow-md"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Send className="h-3.5 w-3.5" />
      )}
      Enviar mensaje
    </Button>
  )
}
