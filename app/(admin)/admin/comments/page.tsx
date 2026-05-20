import { ComingSoonPage } from "@/components/admin/coming-soon-page"
import { MessageSquare } from "lucide-react"

export default function CommentsPage() {
  return (
    <ComingSoonPage
      title="Comentarios"
      description="Moderación de comentarios y reflexiones de la comunidad. Próximamente."
      icon={MessageSquare}
    />
  )
}
