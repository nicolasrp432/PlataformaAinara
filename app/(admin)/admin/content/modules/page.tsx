import { requireAdmin } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { ModuleManager } from "./module-manager";
export default async function ModulesPage() {
  await requireAdmin();
  const db = await createClient();
  const { data, error } = await db
    .from("formations")
    .select(
      "id,title,modules(id,title,description,is_published,sort_order,lessons(id,module_id,title,content_type,is_published,sort_order))",
    )
    .order("title");
  if (error) throw new Error("No se pudo cargar el temario");
  const formations = (data ?? []).map((f) => ({
    ...f,
    modules: f.modules
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((m) => ({
        ...m,
        lessons: m.lessons.sort((a, b) => a.sort_order - b.sort_order),
      })),
  }));
  return <ModuleManager formations={formations} />;
}
