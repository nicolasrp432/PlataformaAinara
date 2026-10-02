"use client";
import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  updateMentorshipSession,
  updateMentorshipRequest,
} from "@/app/(platform)/mentorship/actions";

export interface MentorshipWorkspaceData {
  sessions: {
    id: string;
    user_id: string;
    scheduled_at: string;
    duration_minutes: number;
    status: string;
    timezone: string;
    meeting_link: string | null;
    notes: string | null;
    user_notes: string | null;
    full_name: string | null;
  }[];
  requests: {
    id: string;
    user_id: string;
    notes: string;
    status: string;
    created_at: string;
    full_name: string | null;
  }[];
}
const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No asistió",
  contacted: "En contacto",
  closed: "Cerrada",
};

function SessionEditor({
  session,
}: {
  session: MentorshipWorkspaceData["sessions"][number];
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <form
      className="space-y-3 rounded-2xl border border-border bg-card p-5"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        startTransition(async () => {
          try {
            const result = await updateMentorshipSession({
              id: session.id,
              meetingLink: String(form.get("meetingLink") ?? ""),
              notes: String(form.get("notes") ?? ""),
              completed: form.get("completed") === "on",
            });
            if (result.error) toast.error(result.error);
            else {
              toast.success("Sesión actualizada");
              router.refresh();
            }
          } catch {
            toast.error("No se pudo conectar. Vuelve a intentarlo.");
          }
        });
      }}
    >
      <div className="flex flex-wrap justify-between gap-2">
        <h3 className="font-semibold">{session.full_name ?? "Participante"}</h3>
        <span className="text-xs text-muted-foreground">
          {statusLabels[session.status] ?? session.status}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        {new Date(session.scheduled_at).toLocaleString("es-ES", {
          timeZone: session.timezone,
          dateStyle: "medium",
          timeStyle: "short",
        })}{" "}
        · {session.timezone} · {session.duration_minutes} min
      </p>
      {session.user_notes && (
        <p className="whitespace-pre-wrap break-words rounded-xl bg-primary/5 p-3 text-sm">
          {session.user_notes}
        </p>
      )}
      <div className="grid gap-1.5">
        <Label htmlFor={`meeting-${session.id}`}>Enlace de videollamada</Label>
        <Input
          id={`meeting-${session.id}`}
          name="meetingLink"
          type="url"
          placeholder="https://…"
          maxLength={2048}
          defaultValue={session.meeting_link ?? ""}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`notes-${session.id}`}>Notas privadas del equipo</Label>
        <Textarea
          id={`notes-${session.id}`}
          name="notes"
          rows={2}
          maxLength={4000}
          defaultValue={session.notes ?? ""}
        />
      </div>
      {session.status === "confirmed" &&
        new Date(session.scheduled_at).getTime() <= Date.now() && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="completed" /> Marcar como completada
          </label>
        )}
      <Button type="submit" disabled={pending} size="sm">
        {pending ? "Guardando…" : "Guardar sesión"}
      </Button>
    </form>
  );
}
function RequestEditor({
  request,
}: {
  request: MentorshipWorkspaceData["requests"][number];
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <article className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap justify-between gap-2">
        <h3 className="font-semibold">{request.full_name ?? "Participante"}</h3>
        <span className="text-xs text-muted-foreground">
          {statusLabels[request.status]}
        </span>
      </div>
      <p className="whitespace-pre-wrap break-words text-sm">{request.notes}</p>
      <Link
        href={`/u/${request.user_id}`}
        className="inline-block text-sm text-primary underline"
      >
        Ver perfil y contactar
      </Link>
      <label className="grid gap-1.5 text-sm">
        Estado de la solicitud
        <select
          value={request.status}
          disabled={pending}
          className="rounded-lg border border-border bg-background p-2"
          onChange={(event) => {
            const status = event.target.value;
            startTransition(async () => {
              try {
                const result = await updateMentorshipRequest(
                  request.id,
                  status,
                );
                if (result.error) toast.error(result.error);
                else {
                  toast.success("Solicitud actualizada");
                  router.refresh();
                }
              } catch {
                toast.error("No se pudo conectar.");
              }
            });
          }}
        >
          <option value="pending">Pendiente</option>
          <option value="contacted">En contacto</option>
          <option value="closed">Cerrada</option>
        </select>
      </label>
    </article>
  );
}
export function MentorshipWorkspace({
  data,
}: {
  data: MentorshipWorkspaceData;
}) {
  return (
    <section className="space-y-5">
      <div>
        <p className="ainara-eyebrow">Equipo de mentoría</p>
        <h2 className="text-2xl">Agenda y solicitudes</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Gestiona tus sesiones, comparte el enlace de encuentro y da
          seguimiento a cada solicitud.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="font-semibold">Sesiones</h3>
          {data.sessions.length ? (
            data.sessions.map((session) => (
              <SessionEditor key={session.id} session={session} />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Todavía no tienes sesiones asignadas.
            </p>
          )}
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold">Solicitudes</h3>
          {data.requests.length ? (
            data.requests.map((request) => (
              <RequestEditor key={request.id} request={request} />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Todavía no hay solicitudes asignadas.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
