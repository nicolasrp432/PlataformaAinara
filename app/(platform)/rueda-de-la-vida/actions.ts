"use server"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { LifeWheelEntry } from "@/lib/life-wheel"
import { lifeWheelSchema } from "@/lib/validations/life-wheel"

export async function saveLifeWheel(input: unknown): Promise<{ entry?: LifeWheelEntry; error?: string }> {
  const parsed = lifeWheelSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || "Revisa los valores de la evaluación." }
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return { error: "Inicia sesión para guardar tu evaluación." }
    const { data, error } = await supabase.from("life_wheel_entries").insert({ user_id: user.id, ...parsed.data }).select("id,scores,focus,intention,created_at").single()
    if (error) return { error: "No se pudo guardar la evaluación. Inténtalo de nuevo; tus cambios siguen aquí." }
    revalidatePath("/rueda-de-la-vida")
    revalidatePath("/dashboard")
    return { entry: data as LifeWheelEntry }
  } catch { return { error: "No se pudo conectar. Inténtalo de nuevo; tus cambios siguen aquí." } }
}
