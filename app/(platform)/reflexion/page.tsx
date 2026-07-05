import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getAuthUser, getDailyReflectionData } from "@/lib/data-access"
import { ReflexionClient } from "./reflexion-client"

export const metadata: Metadata = {
  title: "Reflexión diaria",
  description:
    "Tu diario privado de reflexión y registro emocional. Un momento al día para volver a ti.",
}

export default async function ReflexionPage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const data = await getDailyReflectionData(user.id)

  return (
    <ReflexionClient
      todayEntry={data.todayEntry}
      recent={data.recent}
      streak={data.streak}
      today={data.today}
    />
  )
}
