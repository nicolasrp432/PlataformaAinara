"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VideoPlayer } from "@/components/video/video-player";
import { moderateTestimonial } from "./actions";
export interface TestimonialReview {
  id: string;
  subject_name: string | null;
  caption: string;
  testimonial_text: string | null;
  playback_url: string | null;
  status: string;
  audience: string | null;
  consent_granted_at: string | null;
  consent_version: string | null;
  consent_method: string | null;
  third_party_authorization_evidence: string | null;
  rejection_reason: string | null;
  created_at: string;
  community_testimonial_reports: { id: string; reason: string }[];
}
const labels: Record<string, string> = {
  draft: "Borrador",
  processing: "Procesando",
  pending_review: "Pendiente",
  published: "Publicado",
  rejected: "Rechazado",
  archived: "Archivado",
};
function Review({ item }: { item: TestimonialReview }) {
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState(item.rejection_reason ?? "");
  const router = useRouter();
  const change = (status: string) =>
    startTransition(async () => {
      try {
        const r = await moderateTestimonial({ id: item.id, status, reason });
        if (r.error) toast.error(r.error);
        else {
          toast.success("Moderación guardada");
          router.refresh();
        }
      } catch {
        toast.error("No se pudo guardar");
      }
    });
  return (
    <article className="space-y-4 rounded-xl border bg-card p-5">
      <div className="flex flex-wrap justify-between gap-2">
        <h3 className="font-semibold">
          {item.subject_name || "Testimonio de la comunidad"}
        </h3>
        <span className="text-sm text-muted-foreground">
          {labels[item.status]}
        </span>
      </div>
      {item.playback_url && (
        <details>
          <summary className="cursor-pointer text-sm text-primary">
            Ver vídeo
          </summary>
          <div className="mt-3 max-w-md">
            <VideoPlayer
              src={item.playback_url}
              title={item.subject_name || "Testimonio"}
            />
          </div>
        </details>
      )}
      <p className="whitespace-pre-wrap text-sm">
        {item.testimonial_text || item.caption}
      </p>
      <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
        <p>
          Audiencia:{" "}
          {item.audience === "public_web"
            ? "Web pública"
            : item.audience === "private_review"
              ? "Solo revisión interna"
              : "Comunidad registrada"}
        </p>
        <p>
          Consentimiento:{" "}
          {item.consent_granted_at
            ? new Date(item.consent_granted_at).toLocaleDateString("es-ES")
            : "No consta"}{" "}
          · {item.consent_version ?? "Sin versión"}
        </p>
        {item.third_party_authorization_evidence && (
          <p className="mt-2">
            Evidencia: {item.third_party_authorization_evidence}
          </p>
        )}
      </div>
      {item.community_testimonial_reports.length > 0 && (
        <div className="rounded-lg border border-destructive/30 p-3 text-sm">
          <p className="font-semibold">
            {item.community_testimonial_reports.length} reportes
          </p>
          {item.community_testimonial_reports.map((r) => (
            <p key={r.id} className="mt-2">
              {r.reason}
            </p>
          ))}
        </div>
      )}
      <Textarea
        aria-label="Motivo de rechazo"
        placeholder="Motivo del rechazo (obligatorio para rechazar)"
        value={reason}
        maxLength={1000}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={
            pending ||
            item.status === "published" ||
            item.audience === "private_review" ||
            !item.consent_granted_at ||
            !item.playback_url
          }
          onClick={() => change("published")}
        >
          Publicar
        </Button>
        <Button
          variant="outline"
          disabled={pending || !reason.trim()}
          onClick={() => change("rejected")}
        >
          Rechazar
        </Button>
        <Button
          variant="outline"
          disabled={pending || item.status === "archived"}
          onClick={() => change("archived")}
        >
          Archivar / retirar
        </Button>
      </div>
    </article>
  );
}
export function ModerationList({
  testimonials,
}: {
  testimonials: TestimonialReview[];
}) {
  const [filter, setFilter] = useState("pending_review");
  const visible = testimonials.filter(
    (t) => filter === "all" || t.status === filter,
  );
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Bandeja de moderación</h2>
        <select
          aria-label="Filtrar por estado"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border bg-background p-2 text-sm"
        >
          <option value="all">Todos ({testimonials.length})</option>
          {Object.entries(labels).map(([value, label]) => (
            <option key={value} value={value}>
              {label} ({testimonials.filter((t) => t.status === value).length})
            </option>
          ))}
        </select>
      </div>
      <p className="text-xs text-muted-foreground">
        Últimos 100 testimonios. La publicación respeta la audiencia del
        consentimiento original.
      </p>
      {visible.map((t) => (
        <Review key={`${t.id}-${t.status}`} item={t} />
      ))}
      {!visible.length && (
        <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          No hay testimonios en este estado.
        </p>
      )}
    </section>
  );
}
