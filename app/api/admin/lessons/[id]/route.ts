import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { lessonResourcesSchema } from "@/lib/validations/lesson-resources";
import { CACHE_TAGS } from "@/lib/cache";

async function requireAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return null;
  return user;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  if (!(await requireAdmin(supabase))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: lesson, error } = await supabase
    .from("lessons")
    .select(`*, modules ( id, title, formations ( id, title ) )`)
    .eq("id", id)
    .single();

  if (error || !lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  const mod = lesson.modules as {
    id: string;
    title: string;
    formations: { id: string; title: string } | null;
  } | null;

  return NextResponse.json({
    ...lesson,
    modules: undefined,
    module_title: mod?.title || "",
    formation_title: mod?.formations?.title || "",
    formation_id: mod?.formations?.id || "",
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  if (!(await requireAdmin(supabase))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body))
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  const parsed = z
    .object({
      title: z.string().trim().min(3).max(200).optional(),
      description: z.string().max(20000).nullable().optional(),
      video_url: z
        .string()
        .url()
        .refine((v) => ["https:", "http:"].includes(new URL(v).protocol))
        .nullable()
        .optional(),
      duration_seconds: z.number().int().min(0).max(86400).optional(),
      xp_reward: z.number().int().min(0).max(10000).optional(),
      is_free: z.boolean().optional(),
      is_published: z.boolean().optional(),
      content_type: z
        .enum(["video", "audio", "text", "quiz", "exercise"])
        .optional(),
      sort_order: z.number().int().min(0).optional(),
      transcript: z.string().max(100000).nullable().optional(),
      resources: lessonResourcesSchema.optional(),
    })
    .safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  const updates = { ...parsed.data, updated_at: new Date().toISOString() };

  const { data, error } = await supabase
    .from("lessons")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Invalida el catálogo cacheado (conteos/publicación de lecciones)
  revalidateTag(CACHE_TAGS.formations);
  revalidatePath("/admin/content", "layout");
  revalidatePath("/learn", "layout");

  return NextResponse.json({ lesson: data });
}
