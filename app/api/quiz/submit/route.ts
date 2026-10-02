import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { rateLimit, rateLimitResponse, maybeSweep } from "@/lib/rate-limit";
const submission = z.object({
  quizId: z.string().uuid(),
  lessonId: z.string().uuid(),
  formationSlug: z.string().max(150),
  answers: z
    .record(z.string().uuid(), z.string().uuid())
    .refine((answers) => Object.keys(answers).length <= 100),
});
export async function POST(req: NextRequest) {
  try {
    const client = await createClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
    const parsed = submission.safeParse(await req.json().catch(() => null));
    if (!parsed.success)
      return NextResponse.json(
        { error: "Respuestas inválidas." },
        { status: 400 },
      );
    const input = parsed.data;
    const access = await client.rpc("can_access_lesson", {
      p_lesson_id: input.lessonId,
    });
    if (access.error || !access.data)
      return NextResponse.json(
        { error: "Esta lección no está disponible." },
        { status: 403 },
      );
    maybeSweep();
    const limited = rateLimitResponse(
      rateLimit(req, "quiz-submit", { windowMs: 60_000, max: 20 }, user.id),
    );
    if (limited) return limited;
    const admin = supabaseAdmin();
    const { data: quiz, error } = await admin
      .from("quizzes")
      .select(
        "id,passing_score,xp_reward,lesson_id,quiz_questions(id,quiz_options(id,is_correct))",
      )
      .eq("id", input.quizId)
      .eq("lesson_id", input.lessonId)
      .single();
    if (error || !quiz)
      return NextResponse.json(
        { error: "El cuestionario no corresponde a esta lección." },
        { status: 404 },
      );
    const questions = quiz.quiz_questions as Array<{
      id: string;
      quiz_options: Array<{ id: string; is_correct: boolean }>;
    }>;
    if (!questions.length)
      return NextResponse.json(
        { error: "El cuestionario está en preparación." },
        { status: 409 },
      );
    let correct = 0;
    const results: Record<
      string,
      { selected: string; correct: string; isCorrect: boolean }
    > = {};
    for (const question of questions) {
      const selected = input.answers[question.id] ?? "";
      const answer =
        question.quiz_options.find((option) => option.is_correct)?.id ?? "";
      const isCorrect = Boolean(answer && selected === answer);
      if (isCorrect) correct++;
      results[question.id] = { selected, correct: answer, isCorrect };
    }
    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= quiz.passing_score;
    const saved = await admin
      .from("quiz_attempts")
      .insert({
        user_id: user.id,
        quiz_id: quiz.id,
        score,
        passed,
        answers: input.answers,
      });
    if (saved.error) throw new Error("Attempt was not saved");
    let xpEarned = 0;
    let leveledUp = false;
    if (passed) {
      const completed = await client.rpc("complete_lesson", {
        p_lesson_id: input.lessonId,
      });
      if (completed.error)
        return NextResponse.json(
          {
            error:
              "Tus respuestas están guardadas, pero no se pudo actualizar el progreso. Inténtalo de nuevo.",
          },
          { status: 503 },
        );
      xpEarned = completed.data?.xpEarned ?? 0;
      leveledUp = completed.data?.leveledUp ?? false;
      revalidatePath(`/learn/${input.formationSlug}/${input.lessonId}`);
      revalidatePath("/dashboard");
      revalidatePath("/profile");
      revalidatePath("/quest");
    }
    return NextResponse.json({
      score,
      passed,
      passingScore: quiz.passing_score,
      results,
      xpEarned,
      leveledUp,
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudieron guardar tus respuestas. Inténtalo de nuevo." },
      { status: 503 },
    );
  }
}
