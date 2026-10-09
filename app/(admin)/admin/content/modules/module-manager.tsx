"use client";
import { useState } from "react";
import Link from "next/link";
import {
  CurriculumEditor,
  type CurriculumModule,
} from "@/components/admin/curriculum-editor";
export function ModuleManager({
  formations,
}: {
  formations: { id: string; title: string; modules: CurriculumModule[] }[];
}) {
  const [id, setId] = useState(formations[0]?.id ?? "");
  const formation = formations.find((f) => f.id === id);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Módulos y lecciones</h1>
        <p className="mt-2 text-muted-foreground">
          Selecciona una formación para organizar su recorrido.
        </p>
      </div>
      <label className="grid max-w-xl gap-2 text-sm">
        Formación
        <select
          className="rounded-lg border bg-background p-3"
          value={id}
          onChange={(e) => setId(e.target.value)}
        >
          {formations.map((f) => (
            <option key={f.id} value={f.id}>
              {f.title}
            </option>
          ))}
        </select>
      </label>
      {formation ? (
        <>
          <Link
            href={`/admin/content/formations/${formation.id}`}
            className="inline-block text-sm text-primary underline"
          >
            Editar detalles de la formación
          </Link>
          <CurriculumEditor
            key={formation.id}
            formationId={formation.id}
            initialModules={formation.modules}
          />
        </>
      ) : (
        <Link
          href="/admin/content/formations/new"
          className="text-primary underline"
        >
          Crear la primera formación
        </Link>
      )}
    </div>
  );
}
