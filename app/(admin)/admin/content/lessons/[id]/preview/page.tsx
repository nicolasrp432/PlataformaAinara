import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { ContentPreview } from "@/components/admin/content-preview";

export default async function LessonPreview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const db = await createClient();
  const { data: lesson, error } = await db
    .from("lessons")
    .select("*, modules(formation_id, title)")
    .eq("id", id)
    .single();
  if (error || !lesson) notFound();
  const { data: quiz } =
    lesson.content_type === "quiz"
      ? await db
          .from("quizzes")
          .select("*, questions:quiz_questions(*, options:quiz_options(*))")
          .eq("lesson_id", id)
          .maybeSingle()
      : { data: null };
  if (quiz) {
    quiz.questions.sort(
      (a: { sort_order: number }, b: { sort_order: number }) =>
        a.sort_order - b.sort_order,
    );
    quiz.questions.forEach((q: { options: { sort_order: number }[] }) =>
      q.options.sort((a, b) => a.sort_order - b.sort_order),
    );
  }
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
        <p className="font-semibold">
          Vista previa privada ·{" "}
          {lesson.is_published ? "Publicado" : "Borrador"}
        </p>
        <p className="mt-1 text-muted-foreground">
          Muestra la última versión guardada. Las respuestas de prueba no
          generan progreso, XP ni certificados.
        </p>
        <div className="mt-3 flex flex-wrap gap-4">
          <Link
            className="text-primary underline"
            href={`/admin/content/lessons/${id}`}
          >
            Editar contenido
          </Link>
          <Link
            className="text-primary underline"
            href={`/admin/content/formations/${lesson.modules.formation_id}/preview`}
          >
            Ver recorrido completo
          </Link>
        </div>
      </div>
      <h1 className="font-display text-3xl">{lesson.title}</h1>
      <ContentPreview lesson={lesson} quiz={quiz} />
    </div>
  );
}
