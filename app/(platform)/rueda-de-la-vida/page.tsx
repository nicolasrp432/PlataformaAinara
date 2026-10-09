import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/data-access";
import { createClient } from "@/lib/supabase/server";
import type { LifeWheelEntry } from "@/lib/life-wheel";
import { LifeWheelClient } from "./wheel-client";
export const metadata: Metadata = {
  title: "Rueda de la vida",
  description:
    "Observa tu momento presente, elige una prioridad y sigue tu evolución.",
};
export default async function LifeWheelPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  const supabase = await createClient();
  const fields = "id,scores,focus,intention,created_at";
  const [recent, first] = await Promise.all([
    supabase
      .from("life_wheel_entries")
      .select(fields)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(24),
    supabase
      .from("life_wheel_entries")
      .select(fields)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);
  return (
    <LifeWheelClient
      entries={(recent.data ?? []) as LifeWheelEntry[]}
      baseline={first.data as LifeWheelEntry | null}
      unavailable={Boolean(recent.error || first.error)}
    />
  );
}
