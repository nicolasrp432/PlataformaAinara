import { createClient } from "@/lib/supabase/server"
import { ReelPlayer } from "@/components/community/reel-player"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { moderateTestimonial } from "./actions"

export default async function TestimonialsAdminPage() {
  const supabase = await createClient()
  const { data: items } = await supabase.from("community_testimonials")
    .select("id, caption, playback_url, thumbnail_url, status, created_at, rejection_reason, profiles!author_id(full_name)")
    .order("created_at", { ascending: false })
  return <main className="space-y-6"><div><h1 className="text-3xl font-semibold">Testimonios</h1><p className="text-muted-foreground">Modera los vídeos antes de que sean visibles en la comunidad.</p></div>
    <div className="grid gap-5 lg:grid-cols-2">{(items || []).map(item => <article key={item.id} className="grid grid-cols-[140px_1fr] gap-4 rounded-xl border p-4">
      {item.playback_url ? <ReelPlayer src={item.playback_url} poster={item.thumbnail_url} caption={item.caption} /> : <div className="aspect-[9/16] rounded-lg bg-muted grid place-items-center text-xs">Procesando</div>}
      <div><span className="rounded bg-muted px-2 py-1 text-xs">{item.status}</span><p className="mt-3">{item.caption}</p><p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString("es-ES")}</p>
        <form action={moderateTestimonial} className="mt-4 space-y-2"><input type="hidden" name="id" value={item.id} /><Input name="reason" placeholder="Motivo del rechazo" defaultValue={item.rejection_reason || ""} />
          <div className="flex flex-wrap gap-2"><Button size="sm" name="action" value="approve" disabled={item.status === "published"}>Aprobar</Button><Button size="sm" variant="outline" name="action" value="reject">Rechazar</Button><Button size="sm" variant="outline" name="action" value="archive">Retirar</Button><Button size="sm" variant="destructive" name="action" value="delete">Eliminar</Button></div>
        </form>
      </div></article>)}</div>
  </main>
}
