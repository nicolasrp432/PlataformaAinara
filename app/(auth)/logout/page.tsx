"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api-client"
import { Loader2 } from "lucide-react"

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    async function logout() {
      try {
        await api.logout()
      } catch {
        // Continue even if API call fails
      } finally {
        router.push("/login")
        router.refresh()
      }
    }

    logout()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Cerrando sesion...</p>
      </div>
    </div>
  )
}
