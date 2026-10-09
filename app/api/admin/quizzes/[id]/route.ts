import { NextRequest, NextResponse } from "next/server";
import { adminApiClient } from "@/lib/admin-api";
import { quizSchema } from "@/lib/validations/quiz";
import { revalidatePath } from "next/cache";
type Context = { params: Promise<{ id: string }> };
export async function GET(_req: NextRequest, { params }: Context) {
  const db = await adminApiClient();
  if (!db)
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { id } = await params;
  const { data, error } = await db
    .from("quizzes")
    .select("*,questions:quiz_questions(*,options:quiz_options(*))")
    .eq("id", id)
    .single();
  if (error)
    return NextResponse.json(
      { error: "Cuestionario no encontrado" },
      { status: 404 },
    );
  data.questions.sort(
    (a: { sort_order: number }, b: { sort_order: number }) =>
      a.sort_order - b.sort_order,
  );
  data.questions.forEach((q: { options: { sort_order: number }[] }) =>
    q.options.sort((a, b) => a.sort_order - b.sort_order),
  );
  return NextResponse.json({ quiz: data });
}
export async function PATCH(req: NextRequest, { params }: Context) {
  const db = await adminApiClient();
  if (!db)
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { id } = await params;
  const parsed = quizSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  const { error } = await db.rpc("admin_save_quiz", {
    p_id: id,
    p_data: parsed.data,
  });
  if (error)
    return NextResponse.json(
      { error: "No se pudo actualizar el cuestionario" },
      { status: 400 },
    );
  const { data: quiz } = await db
    .from("quizzes")
    .select(
      "id,title,description,passing_score,xp_reward,created_at,lessons(id,title,modules(id,title,formations(id,title)))",
    )
    .eq("id", id)
    .single();
  revalidatePath("/admin/content/quizzes");
  return NextResponse.json({ quiz });
}
export async function DELETE(_req: NextRequest, { params }: Context) {
  const db = await adminApiClient();
  if (!db)
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { id } = await params;
  const { error } = await db
    .from("quizzes")
    .delete()
    .eq("id", id)
    .select("id")
    .single();
  if (error)
    return NextResponse.json({ error: "No se pudo eliminar" }, { status: 400 });
  revalidatePath("/admin/content/quizzes");
  return NextResponse.json({ success: true });
}
