"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Save,
  ArrowUp,
  ArrowDown,
  FileText,
  Video,
  HelpCircle,
  Headphones,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  addCurriculumLesson,
  editCurriculumModule,
  removeCurriculumLesson,
  saveCurriculum,
} from "@/app/(admin)/admin/content/curriculum-actions";
import {
  createModuleAction,
  deleteModuleAction,
} from "@/app/(admin)/admin/content/formations/actions";

export interface CurriculumLesson {
  id: string;
  module_id: string;
  title: string;
  content_type: string;
  is_published: boolean;
  sort_order: number;
}
export interface CurriculumModule {
  id: string;
  title: string;
  description: string | null;
  is_published: boolean;
  sort_order: number;
  lessons?: CurriculumLesson[];
}
const types = {
  video: "Vídeo",
  text: "Artículo",
  quiz: "Cuestionario",
  exercise: "Ejercicio",
  audio: "Audio",
};
const icons = {
  video: Video,
  text: FileText,
  quiz: HelpCircle,
  exercise: Pencil,
  audio: Headphones,
};
const selectClass = "w-full rounded-lg border bg-background p-2 text-sm";

function SortableItem({
  id,
  label,
  disabled,
  children,
}: {
  id: string;
  label: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
      }}
      className="relative rounded-xl border bg-card"
    >
      <div className="flex items-start gap-2 p-3 sm:p-4">
        <button
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
          disabled={disabled}
          aria-label={`Mover ${label}`}
          className="mt-1 touch-none rounded-md p-2 text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary"
        >
          <GripVertical size={18} />
        </button>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
export function CurriculumEditor({
  formationId,
  initialModules,
}: {
  formationId: string;
  initialModules: CurriculumModule[];
}) {
  const router = useRouter();
  const [modules, setModules] = useState(initialModules);
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<{
    kind: "module" | "lesson";
    id?: string;
    moduleId?: string;
  } | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const change = (next: CurriculumModule[]) => {
    setModules(next);
    setDirty(true);
  };
  const run = (action: () => Promise<void>) =>
    startTransition(async () => {
      try {
        await action();
      } catch {
        toast.error("No se pudo conectar. Tus cambios siguen en pantalla.");
      }
    });
  const reorderModules = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    change(
      arrayMove(
        modules,
        modules.findIndex((m) => m.id === active.id),
        modules.findIndex((m) => m.id === over.id),
      ),
    );
  };
  function moveLesson(id: string, from: string, to: string) {
    const lesson = modules
      .find((m) => m.id === from)
      ?.lessons?.find((l) => l.id === id);
    if (!lesson || from === to) return;
    change(
      modules.map((m) =>
        m.id === from
          ? { ...m, lessons: m.lessons?.filter((l) => l.id !== id) }
          : m.id === to
            ? {
                ...m,
                lessons: [...(m.lessons ?? []), { ...lesson, module_id: to }],
              }
            : m,
      ),
    );
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-primary/5 p-5">
        <div>
          <h2 className="font-display text-2xl">Diseña el recorrido</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Alterna vídeos, lecturas y preguntas. Arrastra por el asa o usa sus
            teclas de espacio y flechas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={pending || dirty}
            onClick={() => setDialog({ kind: "module" })}
          >
            <Plus size={16} /> Añadir módulo
          </Button>
          <Button
            disabled={!dirty || pending}
            onClick={() =>
              run(async () => {
                const result = await saveCurriculum(
                  formationId,
                  modules.map((m) => ({
                    id: m.id,
                    lessons: (m.lessons ?? []).map((l) => l.id),
                  })),
                );
                if (result.error) return void toast.error(result.error);
                setDirty(false);
                toast.success("Orden del temario guardado");
                router.refresh();
              })
            }
          >
            <Save size={16} />
            {pending ? "Guardando…" : "Guardar orden"}
          </Button>
        </div>
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        {dirty
          ? "Hay movimientos sin guardar. Guarda el orden antes de editar o añadir contenido."
          : `${modules.length} módulos · ${modules.reduce((n, m) => n + (m.lessons?.length ?? 0), 0)} lecciones`}
      </p>
      <DndContext
        id="curriculum-modules"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={reorderModules}
      >
        <SortableContext
          items={modules.map((m) => m.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {modules.map((module, index) => (
              <SortableItem
                key={module.id}
                id={module.id}
                label={module.title}
                disabled={pending}
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                      Módulo {index + 1}
                    </p>
                    <h3 className="text-lg font-semibold">{module.title}</h3>
                    {module.description && (
                      <p className="text-sm text-muted-foreground">
                        {module.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <Badge
                      variant={module.is_published ? "default" : "outline"}
                    >
                      {module.is_published ? "Publicado" : "Borrador"}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Subir módulo"
                      disabled={pending || index === 0}
                      onClick={() =>
                        change(arrayMove(modules, index, index - 1))
                      }
                    >
                      <ArrowUp size={16} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Bajar módulo"
                      disabled={pending || index === modules.length - 1}
                      onClick={() =>
                        change(arrayMove(modules, index, index + 1))
                      }
                    >
                      <ArrowDown size={16} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Editar ${module.title}`}
                      disabled={pending || dirty}
                      onClick={() =>
                        setDialog({ kind: "module", id: module.id })
                      }
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Eliminar ${module.title}`}
                      disabled={pending || dirty}
                      onClick={() => {
                        if (
                          !confirm(
                            `¿Eliminar «${module.title}» y todas sus lecciones? Esta acción no se puede deshacer.`,
                          )
                        )
                          return;
                        run(async () => {
                          const r = await deleteModuleAction(
                            module.id,
                            formationId,
                          );
                          if (!r.success) return void toast.error(r.error);
                          setModules(modules.filter((m) => m.id !== module.id));
                          toast.success("Módulo eliminado");
                        });
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
                <DndContext
                  id={`lessons-${module.id}`}
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={({ active, over }) => {
                    if (!over || active.id === over.id) return;
                    const lessons = module.lessons ?? [];
                    change(
                      modules.map((m) =>
                        m.id === module.id
                          ? {
                              ...m,
                              lessons: arrayMove(
                                lessons,
                                lessons.findIndex((l) => l.id === active.id),
                                lessons.findIndex((l) => l.id === over.id),
                              ),
                            }
                          : m,
                      ),
                    );
                  }}
                >
                  <SortableContext
                    items={(module.lessons ?? []).map((l) => l.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {module.lessons?.map((lesson, lessonIndex) => {
                        const Icon =
                          icons[lesson.content_type as keyof typeof icons] ??
                          FileText;
                        return (
                          <SortableItem
                            key={lesson.id}
                            id={lesson.id}
                            label={lesson.title}
                            disabled={pending}
                          >
                            <div className="flex flex-wrap items-center gap-3">
                              <Icon size={18} className="text-primary" />
                              <div className="min-w-40 flex-1">
                                <p className="text-sm font-medium">
                                  {lessonIndex + 1}. {lesson.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {
                                    types[
                                      lesson.content_type as keyof typeof types
                                    ]
                                  }{" "}
                                  ·{" "}
                                  {lesson.is_published
                                    ? "Publicado"
                                    : "Borrador"}
                                </p>
                              </div>
                              <div className="flex max-w-full flex-wrap items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  disabled={pending || lessonIndex === 0}
                                  aria-label="Subir lección"
                                  onClick={() =>
                                    change(
                                      modules.map((m) =>
                                        m.id === module.id
                                          ? {
                                              ...m,
                                              lessons: arrayMove(
                                                m.lessons ?? [],
                                                lessonIndex,
                                                lessonIndex - 1,
                                              ),
                                            }
                                          : m,
                                      ),
                                    )
                                  }
                                >
                                  <ArrowUp size={14} />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  disabled={
                                    pending ||
                                    lessonIndex ===
                                      (module.lessons?.length ?? 0) - 1
                                  }
                                  aria-label="Bajar lección"
                                  onClick={() =>
                                    change(
                                      modules.map((m) =>
                                        m.id === module.id
                                          ? {
                                              ...m,
                                              lessons: arrayMove(
                                                m.lessons ?? [],
                                                lessonIndex,
                                                lessonIndex + 1,
                                              ),
                                            }
                                          : m,
                                      ),
                                    )
                                  }
                                >
                                  <ArrowDown size={14} />
                                </Button>
                                <Button size="icon" variant="ghost" asChild>
                                  <Link
                                    aria-label={`Vista previa de ${lesson.title}`}
                                    href={`/admin/content/lessons/${lesson.id}/preview`}
                                    target="_blank"
                                  >
                                    <Eye size={16} />
                                  </Link>
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  disabled={dirty}
                                  onClick={() =>
                                    router.push(
                                      `/admin/content/lessons/${lesson.id}`,
                                    )
                                  }
                                  aria-label={`Editar ${lesson.title}`}
                                >
                                  <Pencil size={16} />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  disabled={pending || dirty}
                                  aria-label={`Eliminar ${lesson.title}`}
                                  onClick={() => {
                                    if (
                                      !confirm(
                                        `¿Eliminar «${lesson.title}» y su progreso asociado?`,
                                      )
                                    )
                                      return;
                                    run(async () => {
                                      const r = await removeCurriculumLesson(
                                        lesson.id,
                                      );
                                      if (r.error)
                                        return void toast.error(r.error);
                                      setModules(
                                        modules.map((m) =>
                                          m.id === module.id
                                            ? {
                                                ...m,
                                                lessons: m.lessons?.filter(
                                                  (l) => l.id !== lesson.id,
                                                ),
                                              }
                                            : m,
                                        ),
                                      );
                                      toast.success("Lección eliminada");
                                    });
                                  }}
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                              {modules.length > 1 && (
                                <select
                                  aria-label={`Mover ${lesson.title} a otro módulo`}
                                  className={`${selectClass} sm:max-w-52`}
                                  value={module.id}
                                  disabled={pending}
                                  onChange={(e) =>
                                    moveLesson(
                                      lesson.id,
                                      module.id,
                                      e.target.value,
                                    )
                                  }
                                >
                                  {modules.map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.title}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </SortableItem>
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  disabled={pending || dirty}
                  onClick={() =>
                    setDialog({ kind: "lesson", moduleId: module.id })
                  }
                >
                  <Plus size={15} /> Añadir contenido
                </Button>
              </SortableItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {!modules.length && (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          Crea el primer módulo para empezar a construir el recorrido.
        </div>
      )}
      <Dialog
        open={!!dialog}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.kind === "lesson"
                ? "Añadir contenido"
                : dialog?.id
                  ? "Editar módulo"
                  : "Nuevo módulo"}
            </DialogTitle>
            <DialogDescription>
              {dialog?.kind === "lesson"
                ? "Elige el formato. Podrás editar el contenido en el siguiente paso."
                : "Organiza un bloque del aprendizaje y decide cuándo publicarlo."}
            </DialogDescription>
          </DialogHeader>
          {dialog && (
            <form
              key={dialog.id ?? dialog.moduleId ?? "new"}
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                const title = String(form.get("title"));
                const description = String(form.get("description") || "");
                run(async () => {
                  if (dialog.kind === "lesson") {
                    const targetModule = modules.find(
                      (m) => m.id === dialog.moduleId,
                    );
                    const r = await addCurriculumLesson({
                      module_id: dialog.moduleId,
                      title,
                      content_type: form.get("type"),
                      sort_order:
                        Math.max(
                          -1,
                          ...(targetModule?.lessons ?? []).map(
                            (l) => l.sort_order,
                          ),
                        ) + 1,
                    });
                    if (r.error) return void toast.error(r.error);
                    router.push(`/admin/content/lessons/${r.data.id}`);
                  } else if (dialog.id) {
                    const r = await editCurriculumModule(dialog.id, {
                      title,
                      description,
                      is_published: form.get("published") === "on",
                    });
                    if (r.error) return void toast.error(r.error);
                    setModules(
                      modules.map((m) =>
                        m.id === dialog.id
                          ? {
                              ...m,
                              title,
                              description,
                              is_published: form.get("published") === "on",
                            }
                          : m,
                      ),
                    );
                  } else {
                    const r = await createModuleAction({
                      formation_id: formationId,
                      title,
                      description,
                      sort_order:
                        Math.max(-1, ...modules.map((m) => m.sort_order)) + 1,
                      is_published: form.get("published") === "on",
                    });
                    if (!r.success) return void toast.error(r.error);
                    setModules([...modules, { ...r.data, lessons: [] }]);
                  }
                  setDialog(null);
                  toast.success("Contenido guardado");
                });
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="curriculum-title">Título</Label>
                <Input
                  id="curriculum-title"
                  name="title"
                  required
                  minLength={3}
                  maxLength={100}
                  defaultValue={modules.find((m) => m.id === dialog.id)?.title}
                />
              </div>
              {dialog.kind === "lesson" ? (
                <label className="grid gap-2 text-sm">
                  Formato
                  <select name="type" className={selectClass}>
                    {Object.entries(types).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="curriculum-description">Descripción</Label>
                    <Textarea
                      id="curriculum-description"
                      name="description"
                      maxLength={500}
                      defaultValue={
                        modules.find((m) => m.id === dialog.id)?.description ??
                        ""
                      }
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="published"
                      defaultChecked={
                        modules.find((m) => m.id === dialog.id)?.is_published
                      }
                    />{" "}
                    Publicar módulo
                  </label>
                </>
              )}
              <DialogFooter>
                <Button type="submit" disabled={pending}>
                  {pending
                    ? "Guardando…"
                    : dialog.kind === "lesson"
                      ? "Crear y editar"
                      : "Guardar módulo"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
