import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { RichText } from "@/components/ui/rich-text";
export default async function FormationPreview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const db = await createClient();
  const { data, error } = await db
    .from("formations")
    .select(
      "id,title,description,long_description,is_published,modules(id,title,sort_order,is_published,lessons(id,title,sort_order,content_type,is_published))",
    )
    .eq("id", id)
    .single();
  if (error || !data) notFound();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-xl bg-primary/5 p-4 text-sm">
        Vista previa privada: incluye borradores.{" "}
        <Link
          className="text-primary underline"
          href={`/admin/content/formations/${id}`}
        >
          Volver al editor
        </Link>
      </div>
      <h1 className="font-display text-4xl">{data.title}</h1>
      <RichText text={data.long_description || data.description || ""} />
      {data.modules
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((m, i) => (
          <section key={m.id} className="rounded-xl border p-5">
            <h2 className="mb-3 text-lg font-semibold">
              {i + 1}. {m.title}{" "}
              {!m.is_published && (
                <span className="text-xs text-muted-foreground">
                  · Borrador
                </span>
              )}
            </h2>
            <div className="divide-y">
              {m.lessons
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((l) => (
                  <Link
                    key={l.id}
                    href={`/admin/content/lessons/${l.id}/preview`}
                    className="flex items-center justify-between gap-3 py-4 hover:text-primary"
                  >
                    <span>{l.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {l.content_type} ·{" "}
                      {l.is_published ? "Publicado" : "Borrador"} →
                    </span>
                  </Link>
                ))}
            </div>
            {!m.lessons.length && (
              <p className="text-sm text-muted-foreground">
                Sin contenido todavía.
              </p>
            )}
          </section>
        ))}
      {!data.modules.length && (
        <p>Añade un módulo para comenzar el recorrido.</p>
      )}
    </div>
  );
}
