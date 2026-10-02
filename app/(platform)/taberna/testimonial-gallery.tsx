"use client"

import { ReelPlayer } from "@/components/community/reel-player"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export type TestimonialCard = { id: string; caption: string; playback_url: string; thumbnail_url: string | null; created_at: string; authorName: string | null }

export function TestimonialGallery({ testimonials }: { testimonials: TestimonialCard[] }) {
  const report = async (id: string) => {
    const reason = window.prompt("¿Por qué quieres denunciar este testimonio?")
    if (!reason) return
    const response = await fetch("/api/community/testimonials/report", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ testimonialId: id, reason }) })
    if (response.ok) {
      toast.success("Denuncia enviada al equipo")
    } else {
      toast.error("No se pudo enviar la denuncia")
    }
  }
  if (!testimonials.length) return null
  return <section aria-labelledby="community-stories"><h2 id="community-stories" className="mb-4 text-2xl font-semibold">Historias de la comunidad</h2>
    <div className="grid grid-flow-col auto-cols-[minmax(230px,280px)] gap-4 overflow-x-auto pb-4 snap-x" role="list" aria-label="Testimonios en vídeo">
      {testimonials.map(item => <article key={item.id} className="snap-start" role="listitem" tabIndex={0}>
        <ReelPlayer src={item.playback_url} poster={item.thumbnail_url} caption={item.caption} />
        <p className="mt-2 text-sm">{item.caption}</p>
        <p className="text-xs text-muted-foreground">{item.authorName ? `${item.authorName} · ` : ""}{new Date(item.created_at).toLocaleDateString("es-ES")}</p>
        <Button variant="ghost" size="sm" onClick={() => report(item.id)} aria-label={`Denunciar testimonio: ${item.caption}`}>Denunciar</Button>
      </article>)}
    </div>
  </section>
}
