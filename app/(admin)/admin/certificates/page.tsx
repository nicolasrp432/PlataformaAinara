import { createClient } from "@/lib/supabase/server"
import { Award, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type CertificateRow = {
  id: string
  certificate_number: string
  issued_at: string
  profiles: { full_name: string } | null
  formations: { title: string } | null
}

export default async function CertificatesPage() {
  const supabase = await createClient()

  const { data: certificates } = await supabase
    .from("certificates")
    .select(`
      id, certificate_number, issued_at,
      profiles ( full_name, avatar_url ),
      formations ( title )
    `)
    .order("issued_at", { ascending: false })
    .limit(100)

  const { count: totalCerts } = await supabase
    .from("certificates")
    .select("*", { count: "exact", head: true })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Certificados</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Certificados emitidos automáticamente al completar una formación.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10">
              <Award className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalCerts ?? 0}</p>
              <p className="text-sm text-muted-foreground">Certificados emitidos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {new Set(((certificates ?? []) as CertificateRow[]).map((c) => c.profiles?.full_name)).size}
              </p>
              <p className="text-sm text-muted-foreground">Usuarios certificados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      {!certificates || certificates.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Award className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="font-medium text-muted-foreground">No hay certificados todavía</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Se emitirán automáticamente cuando un usuario complete todas las lecciones de una formación.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Todos los Certificados</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {(certificates as CertificateRow[]).map((cert) => (
                <div key={cert.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10 shrink-0">
                    <Award className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground text-sm truncate">
                      {cert.profiles?.full_name ?? "Usuario desconocido"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {cert.formations?.title ?? "Formación desconocida"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono text-muted-foreground">{cert.certificate_number}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(cert.issued_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-xs shrink-0">
                    Emitido
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
