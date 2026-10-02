"use client";
import { useState } from "react";
import { Plus, Trash2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LessonResource } from "@/types";

export function LessonResourcesEditor({
  value,
  onChange,
}: {
  value: LessonResource[];
  onChange: (value: LessonResource[]) => void;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  function addResource() {
    try {
      if (new URL(url.trim()).protocol !== "https:") throw new Error();
    } catch {
      setError("Usa un enlace HTTPS válido para el material.");
      return;
    }
    const link = url.trim();
    if (!title.trim() || value.length >= 50) return;
    onChange([
      ...value,
      {
        title: title.trim(),
        url: link,
        type: /\.pdf(?:[?#]|$)/i.test(link) ? "pdf" : "link",
      },
    ]);
    setTitle("");
    setUrl("");
    setError(null);
  }
  return (
    <div className="space-y-5">
      {value.length > 0 ? (
        <ul className="space-y-3">
          {value.map((resource, index) => (
            <li
              key={`${resource.url}-${index}`}
              className="flex min-w-0 items-start gap-3 rounded-xl border border-border p-4"
            >
              <Paperclip className="mt-1 h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-semibold">
                  {resource.title}
                </p>
                <a
                  className="break-all text-xs text-muted-foreground underline"
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {resource.url}
                </a>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Eliminar recurso ${resource.title}`}
                onClick={() => onChange(value.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
          Añade el primer material de esta lección.
        </p>
      )}
      <div className="grid gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="grid gap-2">
          <Label htmlFor="resource-title">Nombre del recurso</Label>
          <Input
            id="resource-title"
            maxLength={200}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Cuaderno de práctica"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="resource-url">Enlace del material</Label>
          <Input
            id="resource-url"
            type="url"
            maxLength={2048}
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://…"
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-danger-strong">
            {error}
          </p>
        )}
        <Button
          type="button"
          className="justify-self-start"
          onClick={addResource}
          disabled={!title.trim() || !url.trim() || value.length >= 50}
        >
          <Plus className="mr-2 h-4 w-4" />
          Añadir recurso
        </Button>
        <p className="text-xs text-muted-foreground">
          Enlaza un PDF, vídeo o página de apoyo. Pulsa Guardar para publicar
          los cambios de la lección.
        </p>
      </div>
    </div>
  );
}
