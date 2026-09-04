import { Metadata } from "next"
import { getQuestData } from "@/lib/data-access"
import { requireContentAccess } from "@/lib/guards"
import { QuestClient } from "./quest-client"

export const metadata: Metadata = {
  title: "Logros",
  description: "Cumple tus misiones, gana experiencia y desbloquea insignias de tu evolución.",
}

export default async function QuestPage() {
  // Sesión + suscripción activa. Segunda capa junto al middleware.
  const user = await requireContentAccess("/quest")

  const questData = await getQuestData(user.id)

  return <QuestClient questData={questData} />
}
