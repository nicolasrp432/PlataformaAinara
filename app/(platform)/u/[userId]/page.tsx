import { notFound } from "next/navigation";
import { requireUser } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { getProfileComments } from "@/lib/services/messaging";
import { getUserProfile } from "@/lib/data-access";
import { getProfileActivity } from "@/lib/services/profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { getInitials } from "@/lib/utils";
import { ProfileWall } from "./profile-wall";
import { SendMessageButton } from "./send-message-button";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { z } from "zod";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const current = await requireUser();
  const { userId } = await params;
  if (!z.string().uuid().safeParse(userId).success) notFound();
  const client = await createClient();
  const { data: profile, error } = await client
    .from("member_profiles")
    .select(
      "id,full_name,avatar_url,role,level,xp,bio,profile_visibility,allow_direct_messages",
    )
    .eq("id", userId)
    .maybeSingle();
  if (error || !profile) notFound();
  const isSelf = current.id === userId;
  if (profile.profile_visibility === "private" && !isSelf) notFound();
  const [wall, reflections, activity] = await Promise.all([
    getProfileComments(userId),
    client
      .from("reflections")
      .select("id,content,created_at")
      .eq("user_id", userId)
      .eq("is_public", true)
      .is("parent_id", null)
      .order("created_at", { ascending: false })
      .limit(5),
    isSelf ? getProfileActivity(userId) : Promise.resolve(null),
  ]);
  // Birth details, diary and chart data stay in /profile, never in the directory.
  const own = isSelf ? await getUserProfile(userId) : null;
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        eyebrow="COMUNIDAD / PERSONAS"
        title={
          isSelf ? "Así te ve la comunidad." : "Un camino con nombre propio."
        }
        description="Presentación, reflexiones compartidas y un espacio para conversar."
      />
      <section className="ainara-panel">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <Avatar className="h-24 w-24 shrink-0 border-4 border-background ring-2 ring-primary/30">
            <AvatarImage
              src={profile.avatar_url ?? undefined}
              alt={profile.full_name ?? "Miembro"}
            />
            <AvatarFallback className="bg-primary/15 text-xl text-primary-strong">
              {getInitials(profile.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="ainara-eyebrow">
              {profile.role === "admin"
                ? "ADMINISTRACIÓN"
                : profile.role === "mentor"
                  ? "MENTORÍA"
                  : "MIEMBRO DE MITRA"}
            </p>
            <h2 className="font-display text-3xl">
              {profile.full_name || "Miembro de Mitra"}
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
              {profile.bio ||
                "Este miembro todavía no ha añadido una presentación."}
            </p>
            <div className="mt-5 flex gap-3">
              <Badge variant="outline">Nivel {profile.level ?? 1}</Badge>
              <Badge variant="outline">
                {(profile.xp ?? 0).toLocaleString("es-ES")} XP
              </Badge>
            </div>
          </div>
          {isSelf ? (
            <Button asChild variant="outline">
              <Link href="/profile">Editar mi perfil</Link>
            </Button>
          ) : profile.allow_direct_messages ? (
            <SendMessageButton userId={userId} />
          ) : (
            <p className="text-sm text-muted-foreground">
              No acepta mensajes directos.
            </p>
          )}
        </div>
        {own && (
          <p className="mt-6 border-t pt-4 text-xs text-muted-foreground">
            Tus datos de nacimiento y tu carta natal se consultan en tu perfil
            privado.
          </p>
        )}
      </section>
      {activity && activity.recentLessons.length > 0 && (
        <section className="ainara-panel">
          <h2 className="font-display text-2xl">Tu aprendizaje reciente</h2>
          <div className="mt-5 space-y-3">
            {activity.recentLessons.map((lesson) => (
              <Link
                key={lesson.id}
                href={`/learn/${lesson.formation_slug}/${lesson.id}`}
                className="block rounded-xl border p-4 hover:bg-primary/5"
              >
                <p className="text-sm font-semibold">{lesson.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {lesson.formation_title}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
      <section className="ainara-panel">
        <h2 className="font-display text-2xl">Reflexiones compartidas</h2>
        <div className="mt-5 space-y-4">
          {reflections.data?.length ? (
            reflections.data.map((reflection) => (
              <article key={reflection.id} className="rounded-xl border p-4">
                <p className="whitespace-pre-wrap text-sm">
                  {reflection.content}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {new Date(reflection.created_at).toLocaleDateString("es-ES")}
                </p>
              </article>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Todavía no hay reflexiones compartidas.
            </p>
          )}
        </div>
      </section>
      <section className="ainara-panel">
        <ProfileWall
          profileId={userId}
          currentUserId={current.id}
          initialComments={wall.map((comment) => {
            const raw = comment.profiles;
            return {
              id: comment.id as string,
              content: comment.content as string,
              created_at: comment.created_at as string,
              author_id: comment.author_id as string,
              profiles: (Array.isArray(raw) ? raw[0] : raw) as {
                id: string;
                full_name: string;
                avatar_url: string | null;
              } | null,
            };
          })}
        />
      </section>
    </div>
  );
}
