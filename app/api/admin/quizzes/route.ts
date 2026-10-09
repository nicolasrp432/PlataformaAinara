import { NextRequest, NextResponse } from "next/server";
import { adminApiClient } from "@/lib/admin-api";
import { quizSchema } from "@/lib/validations/quiz";
import { revalidatePath } from "next/cache";
export async function POST(req: NextRequest) {
  const db = await adminApiClient();
  if (!db)
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const parsed = quizSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  const { data: id, error } = await db.rpc("admin_save_quiz", {
    p_id: null,
    p_data: parsed.data,
  });
  if (error)
    return NextResponse.json(
      {
        error:
          "No se pudo guardar el cuestionario. Comprueba que la lección sea de tipo Quiz y no tenga ya preguntas.",
      },
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
