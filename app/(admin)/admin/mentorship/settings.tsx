"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveMentor } from "./actions";
export interface MentorConfig {
  id: string;
  name: string;
  user_id: string | null;
  timezone: string;
  session_price: number;
  session_duration_minutes: number;
  is_active: boolean;
  mentor_availability: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
  }[];
  mentor_blocked_dates: { blocked_date: string }[];
}
const days = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
function ConfigEditor({
  mentor,
  staff,
  onDone,
}: {
  mentor: MentorConfig | null;
  staff: { id: string; full_name: string | null }[];
  onDone: () => void;
}) {
  const [slots, setSlots] = useState(
    mentor?.mentor_availability
      .filter((s) => s.is_active)
      .map((s) => ({
        day: s.day_of_week,
        start: s.start_time.slice(0, 5),
        end: s.end_time.slice(0, 5),
      })) ?? [],
  );
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <form
      className="space-y-5 rounded-xl border bg-card p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        startTransition(async () => {
          try {
            const r = await saveMentor(mentor?.id ?? null, {
              name: form.get("name"),
              userId: form.get("userId"),
              timezone: form.get("timezone"),
              duration: Number(form.get("duration")),
              price: Number(form.get("price")),
              active: form.get("active") === "on",
              availability: slots,
              blockedDates: [
                ...new Set(
                  String(form.get("blocked") ?? "")
                    .split(/[\s,]+/)
                    .filter(Boolean),
                ),
              ],
            });
            if (r.error) return void toast.error(r.error);
            toast.success("Calendario guardado");
            router.refresh();
            onDone();
          } catch {
            toast.error("No se pudo guardar el calendario");
          }
        });
      }}
    >
      <h3 className="text-lg font-semibold">
        {mentor ? `Configurar ${mentor.name}` : "Nueva agenda"}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          Nombre
          <Input
            name="name"
            defaultValue={mentor?.name ?? "Ainara"}
            required
            maxLength={160}
          />
        </label>
        <label className="grid gap-2 text-sm">
          Responsable
          <select
            name="userId"
            className="rounded-lg border bg-background p-2"
            defaultValue={mentor?.user_id ?? ""}
          >
            <option value="">Administración</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name ?? s.id}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          Zona horaria
          <Input
            name="timezone"
            required
            defaultValue={mentor?.timezone ?? "Europe/Madrid"}
          />
        </label>
        <label className="grid gap-2 text-sm">
          Duración por sesión (minutos)
          <Input
            name="duration"
            type="number"
            min={15}
            max={240}
            required
            defaultValue={mentor?.session_duration_minutes ?? 60}
          />
        </label>
        <label className="grid gap-2 text-sm">
          Precio por sesión (EUR)
          <Input
            name="price"
            type="number"
            min={0}
            max={10000}
            step="0.01"
            required
            defaultValue={mentor?.session_price ?? 0}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            name="active"
            type="checkbox"
            defaultChecked={mentor?.is_active ?? false}
          />{" "}
          Agenda disponible para reservas
        </label>
      </div>
      <p className="text-xs text-muted-foreground">
        Solo una agenda puede estar activa para las reservas. Desactiva la
        anterior antes de activar otra. El precio se aplica a sesiones de pago.
        Las sesiones incluidas mantienen las reglas del plan. Los cambios de
        calendario no alteran las reservas ya confirmadas.
      </p>
      <div className="space-y-3">
        <h4 className="font-medium">Disponibilidad semanal</h4>
        {slots.map((slot, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <select
              aria-label={`Día de la franja ${i + 1}`}
              className="rounded-lg border bg-background p-2 text-sm"
              value={slot.day}
              onChange={(e) =>
                setSlots(
                  slots.map((s, j) =>
                    j === i ? { ...s, day: Number(e.target.value) } : s,
                  ),
                )
              }
            >
              {days.map((d, n) => (
                <option key={d} value={n}>
                  {d}
                </option>
              ))}
            </select>
            <Input
              aria-label={`Inicio de la franja ${i + 1}`}
              type="time"
              className="w-32"
              value={slot.start}
              onChange={(e) =>
                setSlots(
                  slots.map((s, j) =>
                    j === i ? { ...s, start: e.target.value } : s,
                  ),
                )
              }
              required
            />
            <span>—</span>
            <Input
              aria-label={`Fin de la franja ${i + 1}`}
              type="time"
              className="w-32"
              value={slot.end}
              onChange={(e) =>
                setSlots(
                  slots.map((s, j) =>
                    j === i ? { ...s, end: e.target.value } : s,
                  ),
                )
              }
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Eliminar franja"
              onClick={() => setSlots(slots.filter((_, j) => j !== i))}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            setSlots([...slots, { day: 1, start: "09:00", end: "13:00" }])
          }
        >
          <Plus size={15} />
          Añadir franja
        </Button>
      </div>
      <label className="grid gap-2 text-sm">
        Fechas bloqueadas (AAAA-MM-DD, separadas por comas)
        <Input
          name="blocked"
          placeholder="2026-12-24, 2026-12-25"
          defaultValue={
            mentor?.mentor_blocked_dates
              .map((d) => d.blocked_date)
              .join(", ") ?? ""
          }
        />
      </label>
      <div className="flex gap-2">
        <Button disabled={pending}>
          {pending ? "Guardando…" : "Guardar calendario"}
        </Button>
        <Button
          variant="outline"
          type="button"
          disabled={pending}
          onClick={onDone}
        >
          Cerrar
        </Button>
      </div>
    </form>
  );
}
export function MentorSettings({
  mentors,
  staff,
}: {
  mentors: MentorConfig[];
  staff: { id: string; full_name: string | null }[];
}) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Agendas y disponibilidad</h2>
        <Button variant="outline" onClick={() => setSelected("new")}>
          <Plus size={16} />
          Nueva agenda
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {mentors.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelected(m.id)}
            className="rounded-xl border bg-card p-4 text-left hover:border-primary"
          >
            <p className="font-semibold">
              {m.name} · {m.is_active ? "Activa" : "Inactiva"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {m.session_duration_minutes} min · {m.session_price ?? 0} € ·{" "}
              {m.timezone}
            </p>
            <p className="mt-2 text-sm text-primary">Configurar calendario →</p>
          </button>
        ))}
      </div>
      {!mentors.length && (
        <p className="text-sm text-muted-foreground">
          Crea una agenda y añade franjas para habilitar las reservas.
        </p>
      )}
      {selected && (
        <ConfigEditor
          key={selected}
          mentor={mentors.find((m) => m.id === selected) ?? null}
          staff={staff}
          onDone={() => setSelected(null)}
        />
      )}
    </section>
  );
}
