import { TestimonialUploadForm } from "./testimonial-upload-form"

export const metadata = { title: "Testimonios — Admin" }

export default function AdminTestimonialsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Testimonios audiovisuales</h1>
        <p className="mt-2 text-muted-foreground">Recoge el consentimiento separado y conserva la evidencia antes de moderar cualquier vídeo.</p>
      </div>
      <TestimonialUploadForm />
    </div>
  )
}
