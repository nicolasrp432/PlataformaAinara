import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getAuthUser, getQuestData } from "@/lib/data-access"
import { QuestClient } from "./quest-client"

export const metadata: Metadata = {
  title: "Logros | Μήτρα",
  description: "Cumple tus misiones, gana experiencia y desbloquea insignias de tu evolución.",
}

export default async function QuestPage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  const questData = await getQuestData(user.id)

  return <QuestClient questData={questData} />
}
