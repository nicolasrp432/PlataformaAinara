"use server";
import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { CACHE_TAGS } from "@/lib/cache";
import {
  createLessonSchema,
  updateModuleSchema,
} from "@/lib/validations/content";

function refresh() {
  revalidateTag(CACHE_TAGS.formations);
  revalidatePath("/admin/content", "layout");
  revalidatePath("/formations", "layout");
  revalidatePath("/learn", "layout");
}
export async function saveCurriculum(
  formationId: string,
  modules: { id: string; lessons: string[] }[],
) {
  await requireAdmin();
  const parsed = z
    .object({
      formationId: z.string().uuid(),
      modules: z
        .array(
          z.object({
            id: z.string().uuid(),
            lessons: z.array(z.string().uuid()),
          }),
        )
        .max(200),
    })
    .safeParse({ formationId, modules });
  if (!parsed.success) return { error: "Orden inválido" };
  const db = await createClient();
  const { error } = await db.rpc("admin_reorder_curriculum", {
    p_formation_id: formationId,
    p_modules: modules,
  });
  if (error)
    return {
      error:
        "No se pudo guardar el orden. Recarga el temario y comprueba la migración 0030.",
    };
  refresh();
  return { success: true };
}
export async function addCurriculumLesson(input: unknown) {
  await requireAdmin();
  const parsed = createLessonSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const db = await createClient();
  const { data, error } = await db
    .from("lessons")
    .insert({ ...parsed.data, slug: `leccion-${crypto.randomUUID()}` })
    .select()
    .single();
  if (error) return { error: "No se pudo crear la lección" };
  refresh();
  return { data };
}
export async function editCurriculumModule(id: string, input: unknown) {
  await requireAdmin();
  const parsed = updateModuleSchema.safeParse(input);
  if (!parsed.success || !z.string().uuid().safeParse(id).success)
    return { error: "Datos del módulo inválidos" };
  const db = await createClient();
  const { error } = await db
    .from("modules")
    .update(parsed.data)
    .eq("id", id)
    .select("id")
    .single();
  if (error) return { error: "No se pudo actualizar el módulo" };
  refresh();
  return { success: true };
}
export async function removeCurriculumLesson(id: string) {
  await requireAdmin();
  if (!z.string().uuid().safeParse(id).success)
    return { error: "Lección inválida" };
  const db = await createClient();
  const { error } = await db
    .from("lessons")
    .delete()
    .eq("id", id)
    .select("id")
    .single();
  if (error) return { error: "No se pudo eliminar la lección" };
  refresh();
  return { success: true };
}
