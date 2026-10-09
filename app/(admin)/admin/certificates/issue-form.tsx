"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { issueCertificate } from "./actions";
export function IssueCertificateForm({
  enrollments,
}: {
  enrollments: { user_id: string; formation_id: string; label: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <form
      className="space-y-3 rounded-xl border bg-card p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const value = String(
          new FormData(e.currentTarget).get("enrollment") ?? "",
        );
        const [user, formation] = value.split(":");
        startTransition(async () => {
          try {
            const r = await issueCertificate(user, formation);
            if (r.error) toast.error(r.error);
            else {
              toast.success("Certificado disponible");
              router.refresh();
            }
          } catch {
            toast.error("No se pudo emitir el certificado");
          }
        });
      }}
    >
      <h2 className="font-semibold">Recuperar un certificado pendiente</h2>
      <p className="text-sm text-muted-foreground">
        Comprueba de nuevo la finalización y emite el certificado si falta. No
        duplica certificados existentes.
      </p>
      <div className="flex flex-wrap gap-3">
        <select
          name="enrollment"
          required
          aria-label="Alumno y formación completada"
          className="min-w-0 flex-1 rounded-lg border bg-background p-2 text-sm"
          defaultValue=""
        >
          <option value="" disabled>
            Seleccionar inscripción completada
          </option>
          {enrollments.map((e) => (
            <option
              key={`${e.user_id}:${e.formation_id}`}
              value={`${e.user_id}:${e.formation_id}`}
            >
              {e.label}
            </option>
          ))}
        </select>
        <Button disabled={pending || !enrollments.length}>
          {pending ? "Comprobando…" : "Comprobar y emitir"}
        </Button>
      </div>
    </form>
  );
}
