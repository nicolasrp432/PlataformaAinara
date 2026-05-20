import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Video, Clock, ArrowRight } from "lucide-react"

export const dynamic = "force-dynamic"

async function getLessons() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("lessons")
    .select(`
      id, title, content_type, duration_seconds, is_published, is_free, video_url,
      modules:module_id(title, formations:formation_id(title))
    `)
    .order("created_at", { ascending: false })
    .limit(50)
  return data ?? []
}

function formatDuration(seconds: number | null) {
  if (!seconds) return null
  const m = Math.floor(seconds / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h ${m % 60}m`
  return `${m}m`
}

export default async function AdminLessonsPage() {
  const lessons = await getLessons()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lecciones</h1>
        <p className="text-muted-foreground">
          Todas las lecciones de la plataforma. Edítalas desde el editor de formación.
        </p>
      </div>

      {lessons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Video className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-medium">No hay lecciones aún</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Crea una formación y agrega lecciones desde su editor.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/admin/content/formations/new">Nueva formación</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {lessons.map((lesson: any) => {
            const mod = Array.isArray(lesson.modules) ? lesson.modules[0] : lesson.modules
            const formation = mod
              ? Array.isArray(mod.formations)
                ? mod.formations[0]
                : mod.formations
              : null

            return (
              <Card key={lesson.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="flex items-center gap-4 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Video className="h-5 w-5 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-sm">{lesson.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formation?.title ?? "—"} · {mod?.title ?? "—"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {formatDuration(lesson.duration_seconds) && (
                      <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDuration(lesson.duration_seconds)}
                      </span>
                    )}
                    {lesson.is_free && (
                      <Badge variant="outline" className="text-xs">Preview</Badge>
                    )}
                    {lesson.video_url ? (
                      <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-200">
                        Video OK
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-600 border-orange-200">
                        Sin video
                      </Badge>
                    )}
                    <Badge variant={lesson.is_published ? "default" : "secondary"} className="text-xs">
                      {lesson.is_published ? "Publicada" : "Borrador"}
                    </Badge>
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/content/lessons/${lesson.id}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
