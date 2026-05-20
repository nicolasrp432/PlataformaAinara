import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Construction } from "lucide-react"

interface ComingSoonPageProps {
  title: string
  description: string
  icon?: React.ComponentType<{ className?: string }>
}

export function ComingSoonPage({
  title,
  description,
  icon: Icon = Construction,
}: ComingSoonPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center py-20 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
            <Icon className="h-10 w-10 text-primary/60" />
          </div>
          <Badge variant="secondary" className="mb-4">
            En desarrollo
          </Badge>
          <h3 className="text-lg font-medium">{title}</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Esta sección está actualmente en desarrollo y estará disponible próximamente.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
