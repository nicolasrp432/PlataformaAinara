import { requireAdmin } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import {
  MentorshipWorkspace,
  type MentorshipWorkspaceData,
} from "@/components/mentorship/mentorship-workspace";
import { MentorSettings, type MentorConfig } from "./settings";
export default async function AdminMentorshipPage() {
  await requireAdmin();
  const db = await createClient();
  const [workspace, mentors, staff] = await Promise.all([
    db.rpc("mentorship_workspace"),
    db
      .from("mentors")
      .select(
        "id,name,user_id,timezone,session_price,session_duration_minutes,is_active,mentor_availability(day_of_week,start_time,end_time,is_active),mentor_blocked_dates(blocked_date)",
      )
      .order("name"),
    db
      .from("profiles")
      .select("id,full_name")
      .in("role", ["admin", "mentor"])
      .order("full_name"),
  ]);
  if (workspace.error || mentors.error || staff.error)
    throw new Error("No se pudo cargar la gestión de mentorías");
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Mentorías</h1>
        <p className="mt-2 text-muted-foreground">
          Calendario, responsables y seguimiento de alumnos desde el panel.
        </p>
      </div>
      <MentorSettings
        mentors={(mentors.data ?? []) as MentorConfig[]}
        staff={staff.data ?? []}
      />
      <MentorshipWorkspace
        data={workspace.data as MentorshipWorkspaceData}
        admin
      />
    </div>
  );
}
