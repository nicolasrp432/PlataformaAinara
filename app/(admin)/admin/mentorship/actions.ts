"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
const schema = z.object({
  name: z.string().trim().min(1).max(160),
  userId: z.string().uuid().or(z.literal("")),
  duration: z.number().int().min(15).max(240),
  price: z.number().min(0).max(10000),
  timezone: z.string().refine((v) => {
    try {
      new Intl.DateTimeFormat("es", { timeZone: v });
      return true;
    } catch {
      return false;
    }
  }),
  active: z.boolean(),
  availability: z
    .array(
      z.object({
        day: z.number().int().min(0).max(6),
        start: z.string().regex(/^\d{2}:\d{2}$/),
        end: z.string().regex(/^\d{2}:\d{2}$/),
      }),
    )
    .max(35),
  blockedDates: z.array(z.string().date()).max(365),
});
export async function saveMentor(id: string | null, input: unknown) {
  await requireAdmin();
  const parsed = schema.safeParse(input);
  if (!parsed.success || (id && !z.string().uuid().safeParse(id).success))
    return { error: "Revisa los datos del calendario" };
  const db = await createClient();
  const { error } = await db.rpc("admin_save_mentor", {
    p_id: id,
    p_data: parsed.data,
  });
  if (error)
    return {
      error:
        "No se pudo guardar. Comprueba que las franjas no se solapen y que cada una permita al menos una sesión, y que no exista otra agenda activa.",
    };
  revalidatePath("/admin/mentorship");
  revalidatePath("/mentorship");
  return { success: true };
}
export async function closeMentorship(
  id: string,
  status: string,
  reason: string,
) {
  await requireAdmin();
  if (
    !z.string().uuid().safeParse(id).success ||
    !["cancelled", "no_show"].includes(status) ||
    reason.trim().length < 3 ||
    reason.length > 1000
  )
    return { error: "Indica un motivo válido" };
  const db = await createClient();
  const { error } = await db.rpc("admin_close_mentorship", {
    p_id: id,
    p_status: status,
    p_reason: reason,
  });
  if (error) return { error: "No se pudo cambiar el estado de esta sesión" };
  revalidatePath("/admin/mentorship");
  revalidatePath("/mentorship");
  revalidatePath("/profile");
  return { success: true };
}
