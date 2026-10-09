"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const sessionSchema = z.object({
  id: z.string().uuid(),
  meetingLink: z
    .union([z.literal(""), z.string().url().startsWith("https://")])
    .pipe(z.string().max(2048)),
  notes: z.string().trim().max(4000),
  completed: z.boolean(),
});
export async function updateMentorshipSession(
  input: z.input<typeof sessionSchema>,
) {
  const parsed = sessionSchema.safeParse(input);
  if (!parsed.success)
    return { error: "Comprueba el enlace HTTPS y las notas de la sesión." };
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return { error: "Inicia sesión para gestionar la agenda." };
  const { error } = await client.rpc("update_mentorship_session", {
    p_id: parsed.data.id,
    p_meeting_link: parsed.data.meetingLink,
    p_notes: parsed.data.notes,
    p_completed: parsed.data.completed,
  });
  if (error)
    return {
      error:
        "No se pudo guardar. Comprueba que la sesión está asignada a ti y que ya ha empezado si la marcas como completada.",
    };
  revalidatePath("/admin/mentorship");
  revalidatePath("/mentorship");
  revalidatePath("/profile");
  return { success: true };
}

export async function updateMentorshipRequest(id: string, status: string) {
  if (
    !z.string().uuid().safeParse(id).success ||
    !["pending", "contacted", "closed"].includes(status)
  )
    return { error: "Solicitud inválida." };
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return { error: "Inicia sesión para gestionar solicitudes." };
  const { error } = await client.rpc("update_mentorship_request", {
    p_id: id,
    p_status: status,
  });
  if (error) return { error: "No se pudo actualizar esta solicitud." };
  revalidatePath("/admin/mentorship");
  revalidatePath("/mentorship");
  return { success: true };
}
