"use client"

import { useEffect, useState } from "react"
import * as tus from "tus-js-client"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

type Metadata = { duration: number; width: number; height: number }

export function TestimonialUploadForm() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>()
  const [metadata, setMetadata] = useState<Metadata>()
  const [caption, setCaption] = useState("")
  const [consent, setConsent] = useState(false)
  const [authorization, setAuthorization] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])
  const choose = (selected?: File) => {
    if (!selected) return
    if (preview) URL.revokeObjectURL(preview)
    const url = URL.createObjectURL(selected)
    const video = document.createElement("video")
    video.preload = "metadata"
    video.onloadedmetadata = () => { setMetadata({ duration: video.duration, width: video.videoWidth, height: video.videoHeight }); URL.revokeObjectURL(video.src) }
    video.src = URL.createObjectURL(selected)
    setFile(selected); setPreview(url); setProgress(0)
  }
  const submit = async () => {
    if (!file || !metadata) return
    setUploading(true)
    const response = await fetch("/api/community/testimonials/upload", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
      fileName: file.name, mimeType: file.type, size: file.size, caption, consent, peopleAuthorization: authorization, ...metadata,
    }) })
    const result = await response.json()
    if (!response.ok) { toast.error(result.error); setUploading(false); return }
    new tus.Upload(file, { endpoint: result.uploadUrl, uploadUrl: result.uploadUrl, retryDelays: [0, 1000, 3000],
      onProgress: (sent, total) => setProgress(Math.round(sent / total * 100)),
      onError: () => { toast.error("La subida se interrumpió. Inténtalo de nuevo."); setUploading(false) },
      onSuccess: () => { toast.success("Vídeo recibido. Se publicará únicamente después de la revisión."); setUploading(false); setProgress(100) },
    }).start()
  }

  return <section className="rounded-2xl border border-border bg-card p-5" aria-labelledby="share-testimonial">
    <h2 id="share-testimonial" className="text-xl font-semibold">Comparte tu testimonio</h2>
    <p className="mt-1 text-sm text-muted-foreground">Vídeo vertical, máximo 90 segundos y 150 MB. Primero lo revisará el equipo.</p>
    <div className="mt-4 grid gap-5 md:grid-cols-[180px_1fr]">
      <label className="flex aspect-[9/16] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed bg-muted text-center text-sm">
        {preview ? <video src={preview} playsInline controls className="h-full w-full object-cover" aria-label="Previsualización del testimonio" /> : "Seleccionar vídeo 9:16"}
        <input type="file" accept="video/mp4,video/webm,video/quicktime" className="sr-only" onChange={e => choose(e.target.files?.[0])} />
      </label>
      <div className="space-y-4">
        <label className="block text-sm font-medium">Pie del vídeo<Textarea value={caption} maxLength={1000} onChange={e => setCaption(e.target.value)} className="mt-1" /></label>
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /> Consiento el tratamiento y la publicación de este vídeo en la comunidad.</label>
        <label className="flex gap-2 text-sm"><input type="checkbox" checked={authorization} onChange={e => setAuthorization(e.target.checked)} /> Confirmo que poseo autorización de todas las personas reconocibles.</label>
        {uploading && <div aria-live="polite"><Progress value={progress} /><span className="text-sm">Subida: {progress}%</span></div>}
        <Button type="button" onClick={submit} disabled={!file || !metadata || !caption.trim() || !consent || !authorization || uploading}>Enviar a revisión</Button>
      </div>
    </div>
  </section>
}
