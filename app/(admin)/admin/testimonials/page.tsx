import { requireAdmin } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { TestimonialUploadForm } from "./testimonial-upload-form";
import { ModerationList, type TestimonialReview } from "./moderation-list";
export const metadata = { title: "Testimonios — Admin" };
export default async function AdminTestimonialsPage() {
  await requireAdmin();
  const db = await createClient();
  const { data, error } = await db
    .from("community_testimonials")
    .select(
      "id,subject_name,caption,testimonial_text,playback_url,status,audience,consent_granted_at,consent_version,consent_method,third_party_authorization_evidence,rejection_reason,created_at,community_testimonial_reports(id,reason)",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("No se pudo cargar la bandeja de testimonios");
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Testimonios</h1>
        <p className="mt-2 text-muted-foreground">
          Revisa los vídeos, su audiencia autorizada y los reportes antes de
          publicarlos.
        </p>
      </div>
      <ModerationList testimonials={(data ?? []) as TestimonialReview[]} />
      <details className="rounded-xl border bg-card p-5">
        <summary className="cursor-pointer text-lg font-semibold">
          Añadir testimonio audiovisual
        </summary>
        <div className="mt-6">
          <TestimonialUploadForm />
        </div>
      </details>
    </div>
  );
}
