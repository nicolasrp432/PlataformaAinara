"use client";
import { RichText } from "@/components/ui/rich-text";
import { VideoPlayer } from "@/components/video/video-player";
import { QuizPlayer, type QuizData } from "@/components/exercises/quiz-player";
import { lessonResources } from "@/lib/lesson-resources";
export function ContentPreview({
  lesson,
  quiz,
}: {
  lesson: {
    id: string;
    title: string;
    content_type: string;
    description: string | null;
    transcript: string | null;
    video_url: string | null;
    resources: unknown;
  };
  quiz: QuizData | null;
}) {
  return (
    <div className="space-y-6 rounded-2xl border bg-card p-5 sm:p-8">
      {lesson.content_type === "quiz" ? (
        quiz ? (
          <QuizPlayer
            lessonId={lesson.id}
            formationId=""
            formationSlug=""
            previewQuiz={quiz}
          />
        ) : (
          <p>
            Este cuestionario todavía no tiene preguntas. Añádelas desde el
            editor.
          </p>
        )
      ) : lesson.content_type === "text" ||
        lesson.content_type === "exercise" ? (
        <RichText
          text={
            lesson.transcript ||
            lesson.description ||
            "Añade el contenido desde el editor."
          }
          className="mx-auto max-w-3xl text-base leading-relaxed"
        />
      ) : lesson.video_url ? (
        lesson.content_type === "audio" ? (
          <audio src={lesson.video_url} controls className="w-full" />
        ) : (
          <VideoPlayer src={lesson.video_url} title={lesson.title} />
        )
      ) : (
        <p className="p-10 text-center text-muted-foreground">
          Archivo multimedia pendiente
        </p>
      )}
      {lesson.description &&
        !["text", "exercise"].includes(lesson.content_type) && (
          <RichText text={lesson.description} />
        )}
      {lessonResources(lesson.resources).map((r) => (
        <a
          key={r.url}
          href={r.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-primary underline"
        >
          {r.title}
        </a>
      ))}
    </div>
  );
}
