"use server";
import { requireAdmin } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
export async function issueCertificate(userId: string, formationId: string) {
  await requireAdmin();
  if (
    !z.string().uuid().safeParse(userId).success ||
    !z.string().uuid().safeParse(formationId).success
  )
    return { error: "Selecciona un alumno y una formación" };
  const db = await createClient();
  const { error } = await db.rpc("admin_issue_certificate", {
    p_user_id: userId,
    p_formation_id: formationId,
  });
  if (error)
    return {
      error:
        "No se puede emitir: el alumno debe haber completado todas las lecciones publicadas de la formación.",
    };
  revalidatePath("/admin/certificates");
  revalidatePath("/profile");
  return { success: true };
}
