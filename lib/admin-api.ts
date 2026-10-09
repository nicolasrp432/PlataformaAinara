import { createClient } from "@/lib/supabase/server";
export async function adminApiClient() {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;
  const { data } = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return data?.role === "admin" ? db : null;
}
