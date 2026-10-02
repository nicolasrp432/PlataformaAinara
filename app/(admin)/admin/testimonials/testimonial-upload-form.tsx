"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { VideoUploader } from "@/components/admin/video-uploader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { TESTIMONIAL_LEGAL_VERSION } from "@/lib/legal-versions"
import { saveTestimonialAction } from "./actions"

type UploadedVideo = {
  videoId: string
  videoUrl: string
  duration: number
  thumbnail: string
}

export function TestimonialUploadForm() {
  const [consent, setConsent] = useState(false)
  const [isThirdParty, setIsThirdParty] = useState(false)
  const [video, setVideo] = useState<UploadedVideo | null>(null)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)
  const [pending, setPending] = useState(false)

  async function submit(formData: FormData) {
    if (!video || !consent) return
    setPending(true)
    setError("")
    const result = await saveTestimonialAction({
      subjectName: formData.get("subjectName"),
      testimonialText: formData.get("testimonialText"),
      audience: formData.get("audience"),
      authorizationEvidence: formData.get("authorizationEvidence"),
      authorizationAcceptedAt: formData.get("authorizationAcceptedAt") ?? "",
      consent,
      isThirdParty,
      ...video,
    })
    setPending(false)
    if (result.error) setError(result.error)
    else setSaved(true)
  }

  if (saved) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6">
        <CheckCircle2 className="mb-3 h-7 w-7 text-emerald-600" />
        <h2 className="font-semibold">Testimonio guardado para revisión</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No se publicará automáticamente. Solicita revisión jurídica antes de aprobarlo,
          especialmente si menciona salud mental, diagnósticos, tratamientos o resultados personales.
        </p>
      </div>
    )
  }

  return (
    <form action={submit} className="space-y-7">
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
        <p className="flex gap-2 font-semibold"><AlertTriangle className="h-5 w-5 shrink-0" /> Revisión jurídica obligatoria antes de publicar</p>
        <p className="mt-2">Todo envío queda pendiente de moderación. Extrema la revisión si contiene categorías especiales de datos o afirmaciones sobre resultados.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subjectName">Nombre de la persona que aparece</Label>
        <Input id="subjectName" name="subjectName" maxLength={160} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="testimonialText">Texto testimonial o transcripción (opcional)</Label>
        <Textarea id="testimonialText" name="testimonialText" maxLength={4000} rows={5} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="audience">Audiencia autorizada</Label>
        <select id="audience" name="audience" defaultValue="private_review" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
          <option value="private_review">Solo revisión interna</option>
          <option value="registered_users">Personas registradas</option>
          <option value="public_web">Web pública y redes propias</option>
        </select>
      </div>

      <label className="flex items-start gap-3 rounded-lg border p-4 text-sm">
        <input type="checkbox" checked={isThirdParty} onChange={(event) => setIsThirdParty(event.target.checked)} className="mt-1 h-4 w-4" />
        <span><strong>Subo el vídeo en nombre de otra persona.</strong> Solo puede hacerlo una persona administradora que haya comprobado una autorización escrita específica.</span>
      </label>
      {isThirdParty && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="authorizationAcceptedAt">Fecha en que la persona autorizó el uso</Label>
            <Input id="authorizationAcceptedAt" name="authorizationAcceptedAt" type="date" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="authorizationEvidence">Evidencia de autorización</Label>
            <Textarea id="authorizationEvidence" name="authorizationEvidence" required rows={3} placeholder="Medio, ubicación segura o identificador del documento firmado. No pegues aquí datos sensibles innecesarios." />
            <p className="text-xs text-muted-foreground">Conserva el documento íntegro de forma segura mientras se use el testimonio y durante la atención de posibles reclamaciones.</p>
          </div>
        </div>
      )}

      <label className="flex items-start gap-3 rounded-lg border-2 border-primary/30 p-4 text-sm">
        <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 h-4 w-4" />
        <span>
          <strong>Consentimiento específico (obligatorio y no preseleccionado).</strong>{" "}
          {isThirdParty ? "Confirmo que la persona identificada autorizó" : "Autorizo"} el tratamiento de imagen, voz, texto testimonial y metadatos para la audiencia elegida, conforme a la{" "}
          <Link href="/privacy#testimonios-audiovisuales" target="_blank" className="underline">información de privacidad</Link> y la{" "}
          <Link href="/terms#licencia-testimonios" target="_blank" className="underline">licencia de testimonios</Link>. Puedo retirarlo sin que ello afecte al tratamiento previo lícito.
          <span className="mt-1 block text-xs text-muted-foreground">Versión: {TESTIMONIAL_LEGAL_VERSION}. Esta aceptación es independiente de los términos generales.</span>
        </span>
      </label>

      <VideoUploader uploadPurpose="community_testimonial" disabled={!consent} onUploadComplete={setVideo} onUploadError={(uploadError) => setError(uploadError.message)} />
      {!consent && <p className="text-sm text-muted-foreground">Marca el consentimiento específico para habilitar la subida.</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={!consent || !video || pending}>{pending ? "Guardando…" : "Guardar para moderación"}</Button>
    </form>
  )
}
