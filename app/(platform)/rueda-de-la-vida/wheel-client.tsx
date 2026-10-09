"use client";
import { useRef, useState, useTransition, type CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  Download,
  Flag,
  History,
  LockKeyhole,
  PencilLine,
  Plus,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { WheelChart } from "@/components/life-wheel/wheel-chart";
import { AreaIcon } from "@/components/life-wheel/area-icon";
import { LifeWheelReport } from "@/components/life-wheel/life-wheel-report";
import {
  INITIAL_SCORES,
  LIFE_AREAS,
  lifeWheelHighlights,
  scoreChange,
  selectLifeWheelEntry,
  wheelAverage,
  type LifeAreaKey,
  type LifeWheelEntry,
} from "@/lib/life-wheel";
import { saveLifeWheel } from "./actions";

const date = (value: string) =>
  new Date(value).toLocaleString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
const examples: Record<LifeAreaKey, string> = {
  health: "Salir a caminar veinte minutos, tres días esta semana.",
  relationships:
    "Reservar un rato sin pantallas para hablar con alguien importante para mí.",
  family:
    "Llamar a una persona de mi familia o proponer un encuentro con una amistad.",
  work: "Dedicar quince minutos a identificar qué me da sentido en mi trabajo.",
  money: "Revisar mis gastos de la semana con calma durante veinte minutos.",
  growth: "Dedicar diez minutos a escribir lo que estoy aprendiendo de mí.",
  leisure:
    "Reservar una tarde para una actividad que disfruto, sin obligaciones.",
  environment:
    "Ordenar un rincón de casa para tener un lugar en el que descansar.",
};

export function LifeWheelClient({
  entries,
  baseline: initialBaseline,
  unavailable = false,
}: {
  entries: LifeWheelEntry[];
  baseline?: LifeWheelEntry | null;
  unavailable?: boolean;
}) {
  const [history, setHistory] = useState(entries);
  const [baseline, setBaseline] = useState(
    initialBaseline === undefined ? (entries.at(-1) ?? null) : initialBaseline,
  );
  const [scores, setScores] = useState({ ...INITIAL_SCORES });
  const [rated, setRated] = useState<LifeAreaKey[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [focus, setFocus] = useState<LifeAreaKey>("health");
  const [intention, setIntention] = useState("");
  const [comparison, setComparison] = useState("baseline");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [reportEntry, setReportEntry] = useState<LifeWheelEntry | null>(null);
  const ratingInput = useRef<HTMLInputElement>(null);
  const planHeading = useRef<HTMLHeadingElement>(null);
  const previous =
    comparison === "baseline"
      ? baseline
      : history.find((entry) => entry.id === comparison);
  const complete = rated.length === LIFE_AREAS.length;
  const active = LIFE_AREAS[activeIndex];
  const highlights = complete ? lifeWheelHighlights(scores) : null;
  const latest = history[0];
  const update = (key: LifeAreaKey, value: number) => {
    setScores((current) => ({ ...current, [key]: value }));
    setRated((current) =>
      current.includes(key) ? current : [...current, key],
    );
    setSaved(false);
  };
  function confirmArea() {
    update(active.key, scores[active.key]);
    const next = LIFE_AREAS.findIndex(
      (area, index) => index > activeIndex && !rated.includes(area.key),
    );
    const remaining = LIFE_AREAS.findIndex(
      (area) => area.key !== active.key && !rated.includes(area.key),
    );
    if (next >= 0 || remaining >= 0) {
      setActiveIndex(next >= 0 ? next : remaining);
      ratingInput.current?.focus();
    } else {
      planHeading.current?.focus();
      planHeading.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }
  function save() {
    startTransition(async () => {
      try {
        const result = await saveLifeWheel({ scores, focus, intention });
        if (result.error) {
          toast.error(result.error);
          return;
        }
        if (result.entry) {
          const entry = result.entry;
          setHistory((current) => [entry, ...current].slice(0, 24));
          setBaseline((current) => current ?? entry);
          setSaved(true);
          setReportEntry(entry);
          toast.success(
            "Tu evaluación ha quedado guardada. Cada pequeño paso cuenta.",
          );
        }
      } catch {
        toast.error(
          "No se pudo conectar. Tus respuestas siguen aquí; vuelve a intentarlo.",
        );
      }
    });
  }
  function openReport(id: string) {
    const entry =
      selectLifeWheelEntry(history, id) ??
      (baseline?.id === id ? baseline : null);
    if (entry) setReportEntry(entry);
  }
  function startNew() {
    setScores({ ...INITIAL_SCORES });
    setRated([]);
    setActiveIndex(0);
    setIntention("");
    setSaved(false);
    setReportEntry(null);
  }
  function printReport() {
    if (!reportEntry) return;
    const originalTitle = document.title;
    document.title = `mitra-rueda-de-la-vida-${reportEntry.created_at.slice(0, 10)}.pdf`;
    window.addEventListener(
      "afterprint",
      () => {
        document.title = originalTitle;
      },
      { once: true },
    );
    window.print();
  }
  if (reportEntry)
    return (
      <div className="life-wheel-report-view space-y-6">
        <div className="life-wheel-report-actions flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" onClick={() => setReportEntry(null)}>
            <PencilLine size={16} /> Volver a mi rueda
          </Button>
          <Button onClick={printReport}>
            <Download size={16} /> Descargar PDF
          </Button>
        </div>
        <LifeWheelReport entry={reportEntry} />
      </div>
    );
  return (
    <div className="life-wheel-experience space-y-8">
      <header className="wheel-welcome">
        <div className="max-w-2xl">
          <p className="ainara-eyebrow">
            <Compass size={16} /> TU MAPA PERSONAL
          </p>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl">
            Todo empieza por escucharte.
          </h1>
          <p className="mt-3 text-muted-foreground">
            Dale un color a cómo te sientes hoy. Descubre qué te sostiene, qué
            necesita atención y elige un pequeño paso para ti.
          </p>
        </div>
        <div className="wheel-welcome-note">
          <Flag size={22} aria-hidden="true" />
          <div>
            <strong>
              {baseline
                ? "Tu camino ya ha empezado"
                : "Este es tu punto de partida"}
            </strong>
            <p>
              {baseline
                ? `Primera evaluación · ${date(baseline.created_at)}`
                : "8 áreas · unos 5 minutos · a tu ritmo"}
            </p>
          </div>
        </div>
      </header>
      {unavailable && (
        <p
          role="alert"
          className="rounded-xl border border-warning-border bg-warning-soft p-4 text-warning-strong"
        >
          El historial no está disponible. Puedes explorar tu rueda, pero el
          guardado está desactivado hasta que se restablezca el servicio.
        </p>
      )}
      <ol className="wheel-steps" aria-label="Cómo completar tu rueda">
        {[
          ["Escúchate", "Valora tus ocho áreas"],
          ["Elige un paso", "Una intención posible"],
          ["Vuelve a ti", "Observa tu evolución"],
        ].map(([title, description], index) => (
          <li key={title}>
            <span>{index + 1}</span>
            <div>
              <strong>{title}</strong>
              <p>{description}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="grid items-start gap-6 xl:grid-cols-[1fr_1.1fr]">
        <section
          className="ainara-panel wheel-map-panel xl:sticky xl:top-8"
          aria-label="Tu mapa actual"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="ainara-eyebrow">01 / ESCÚCHATE</p>
              <h2 className="mt-2 font-display text-2xl">Así te sientes hoy</h2>
            </div>
            <span className="ainara-chip" aria-live="polite">
              {rated.length} de 8 áreas
            </span>
          </div>
          <WheelChart
            scores={scores}
            rated={rated}
            active={active.key}
            previous={previous?.scores}
          />
          <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="h-2 w-5 rounded bg-teal-700" /> Tu valoración de
              hoy
            </span>
            {previous && (
              <span className="flex items-center gap-2">
                <span className="w-5 border-t-2 border-dashed border-stone-500" />{" "}
                {comparison === "baseline"
                  ? "Tu punto de partida"
                  : "Evaluación elegida"}
              </span>
            )}
          </div>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            {complete
              ? `Media personal: ${wheelAverage(scores).toFixed(1)}/10. No necesitas un 10 en todo para estar bien.`
              : "Tu rueda se llena a medida que valoras cada área. Los espacios vacíos aún están por explorar."}
          </p>
          {baseline && (
            <div className="mt-5 space-y-2 border-t pt-5">
              <label htmlFor="wheel-comparison" className="text-sm font-medium">
                Comparar mi rueda con
              </label>
              <Select value={comparison} onValueChange={setComparison}>
                <SelectTrigger id="wheel-comparison">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin comparación</SelectItem>
                  <SelectItem value="baseline">
                    Mi punto de partida · {date(baseline.created_at)}
                  </SelectItem>
                  {history
                    .filter((entry) => entry.id !== baseline.id)
                    .map((entry) => (
                      <SelectItem key={entry.id} value={entry.id}>
                        {date(entry.created_at)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {highlights && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="wheel-insight">
                <SproutIcon />
                <p>Un apoyo para ti</p>
                <strong>{highlights.strength.label}</strong>
                <span>{scores[highlights.strength.key]}/10 hoy</span>
              </div>
              <div className="wheel-insight">
                <Flag size={18} />
                <p>Un espacio que cuidar</p>
                <strong>{highlights.attention.label}</strong>
                <button
                  type="button"
                  onClick={() => {
                    setFocus(highlights.attention.key);
                    setSaved(false);
                    planHeading.current?.focus();
                    planHeading.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }}
                >
                  Elegir como prioridad <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </section>
        <div className="min-w-0 space-y-6">
          <section className="ainara-panel" aria-labelledby="wheel-rate-title">
            <h2 id="wheel-rate-title" className="font-display text-2xl">
              Un área cada vez.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              No hay respuestas correctas. Elige cómo la estás viviendo en este
              momento.
            </p>
            <div
              className="my-5 grid grid-cols-2 gap-2 sm:grid-cols-4"
              aria-label="Áreas de tu vida"
            >
              {LIFE_AREAS.map((area, index) => (
                <button
                  key={area.key}
                  type="button"
                  disabled={pending}
                  aria-pressed={activeIndex === index}
                  onClick={() => setActiveIndex(index)}
                  className="wheel-area-tile"
                  style={{ "--area-color": area.color } as CSSProperties}
                >
                  <span className="wheel-area-tile-icon">
                    <AreaIcon area={area.key} />
                    {rated.includes(area.key) && <Check size={12} />}
                  </span>
                  <span>{area.label}</span>
                  <small>
                    {rated.includes(area.key)
                      ? `${scores[area.key]}/10 · valorada`
                      : "Por explorar"}
                  </small>
                </button>
              ))}
            </div>
            <div
              className="wheel-rating-card"
              style={{ "--area-color": active.color } as CSSProperties}
            >
              <div className="flex items-center gap-3">
                <span className="wheel-rating-icon">
                  <AreaIcon area={active.key} size={25} />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Área {activeIndex + 1} de 8
                  </p>
                  <h3 id="wheel-active-label" className="font-display text-xl">
                    {active.label}
                  </h3>
                </div>
              </div>
              <p
                id="wheel-active-question"
                className="mt-4 text-sm leading-relaxed"
              >
                {active.question}
              </p>
              <div className="my-5 text-center">
                <output htmlFor="wheel-rating" className="wheel-rating-number">
                  {scores[active.key]}
                  <span>/10</span>
                </output>
                <p className="text-xs text-muted-foreground">
                  {rated.includes(active.key)
                    ? "Tu valoración de hoy"
                    : "Valor de guía · ajústalo o confírmalo"}
                </p>
              </div>
              <input
                ref={ratingInput}
                id="wheel-rating"
                className="wheel-range"
                type="range"
                min={1}
                max={10}
                step={1}
                value={scores[active.key]}
                aria-labelledby="wheel-active-label"
                aria-describedby="wheel-active-question"
                aria-valuetext={`${scores[active.key]} de 10`}
                disabled={pending}
                onChange={(event) =>
                  update(active.key, Number(event.target.value))
                }
              />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>1 · Muy poca satisfacción</span>
                <span>10 · Mucha</span>
              </div>
              {previous && rated.includes(active.key) && (
                <p className="mt-4 text-center text-sm">
                  {scoreChange(scores[active.key], previous.scores[active.key])}{" "}
                  respecto a{" "}
                  {comparison === "baseline"
                    ? "tu punto de partida"
                    : "esta evaluación"}{" "}
                  ({previous.scores[active.key]}/10).
                </p>
              )}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={activeIndex === 0 || pending}
                  onClick={() => setActiveIndex((index) => index - 1)}
                >
                  <ArrowLeft size={15} /> Anterior
                </Button>
                <Button disabled={pending} onClick={confirmArea}>
                  Confirmar {scores[active.key]} y{" "}
                  {rated.filter((key) => key !== active.key).length === 7
                    ? "continuar"
                    : "seguir"}{" "}
                  <ArrowRight size={15} />
                </Button>
              </div>
            </div>
            <div
              className="mt-5 h-1.5 overflow-hidden rounded-full bg-secondary"
              role="progressbar"
              aria-label="Áreas valoradas"
              aria-valuemin={0}
              aria-valuemax={8}
              aria-valuenow={rated.length}
            >
              <div
                className="h-full rounded-full bg-teal-700 transition-all"
                style={{ width: `${(rated.length / 8) * 100}%` }}
              />
            </div>
          </section>
          <section
            className="ainara-panel space-y-4"
            aria-labelledby="wheel-plan-title"
          >
            <p className="ainara-eyebrow">02 / ELIGE UN PASO</p>
            <h2
              ref={planHeading}
              tabIndex={-1}
              id="wheel-plan-title"
              className="font-display text-2xl"
            >
              Pequeño, concreto y tuyo.
            </h2>
            <p className="text-sm text-muted-foreground">
              No hace falta cambiarlo todo. Elige un área que te importe y una
              acción que puedas probar esta semana.
            </p>
            <label htmlFor="wheel-focus" className="block text-sm font-medium">
              Quiero dedicar atención a…
            </label>
            <Select
              value={focus}
              disabled={pending}
              onValueChange={(value) => {
                setFocus(value as LifeAreaKey);
                setSaved(false);
              }}
            >
              <SelectTrigger id="wheel-focus">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LIFE_AREAS.map((area) => (
                  <SelectItem key={area.key} value={area.key}>
                    <span className="flex items-center gap-2">
                      <AreaIcon area={area.key} size={16} />
                      {area.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label
              htmlFor="wheel-intention"
              className="block text-sm font-medium"
            >
              Mi pequeño paso esta semana
            </label>
            <Textarea
              id="wheel-intention"
              value={intention}
              disabled={pending}
              maxLength={500}
              onChange={(event) => {
                setIntention(event.target.value);
                setSaved(false);
              }}
              placeholder={examples[focus]}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {intention.length}/500 · ¿Qué harás y cuándo puedes hacerlo?
            </p>
            <Button
              className="w-full"
              onClick={save}
              disabled={
                !complete ||
                !intention.trim() ||
                pending ||
                unavailable ||
                saved
              }
            >
              {pending
                ? "Guardando…"
                : saved
                  ? "Evaluación guardada"
                  : baseline
                    ? "Guardar mi nueva evaluación"
                    : "Guardar mi punto de partida"}
              <Check size={16} />
            </Button>
            {!complete && (
              <p className="text-center text-xs text-muted-foreground">
                Te{" "}
                {8 - rated.length === 1
                  ? "queda 1 área"
                  : `quedan ${8 - rated.length} áreas`}{" "}
                por valorar antes de guardar.
              </p>
            )}
            {saved && (
              <Button variant="outline" className="w-full" onClick={startNew}>
                <Plus size={16} /> Empezar otra evaluación
              </Button>
            )}
            <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <LockKeyhole size={15} className="shrink-0" />
              Solo tú puedes ver esta evaluación. Es una herramienta de
              reflexión, no un diagnóstico.
            </p>
          </section>
        </div>
      </div>
      <section className="ainara-panel" aria-labelledby="wheel-evolution-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="ainara-eyebrow">03 / VUELVE A TI</p>
            <h2
              id="wheel-evolution-title"
              className="mt-2 font-display text-2xl"
            >
              Tu evolución, a tu ritmo.
            </h2>
          </div>
          <History size={24} className="text-muted-foreground" />
        </div>
        {baseline && latest ? (
          <>
            <p className="mb-5 mt-3 text-sm text-muted-foreground">
              {latest.id === baseline.id
                ? "Ya tienes tu punto de partida. Cuando vuelvas a completar la rueda, podrás observar qué ha cambiado."
                : `Tu punto de partida (${date(baseline.created_at)}) frente a tu última evaluación (${date(latest.created_at)}). Los cambios te ayudan a decidir dónde poner atención.`}
            </p>
            {latest.id !== baseline.id && (
              <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {LIFE_AREAS.map((area) => (
                  <div
                    key={area.key}
                    className="wheel-evolution-card"
                    style={{ "--area-color": area.color } as CSSProperties}
                  >
                    <AreaIcon area={area.key} />
                    <h3>{area.label}</h3>
                    <p>
                      {baseline.scores[area.key]} <ArrowRight size={14} />{" "}
                      <strong>
                        {latest.scores[area.key]}
                        <small>/10</small>
                      </strong>
                    </p>
                    <span>
                      {scoreChange(
                        latest.scores[area.key],
                        baseline.scores[area.key],
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="wheel-last-intention">
              <Flag size={20} />
              <div>
                <p className="text-sm font-semibold">
                  Tu último compromiso ·{" "}
                  {LIFE_AREAS.find((area) => area.key === latest.focus)?.label}
                </p>
                <p className="mt-1 break-words text-sm text-muted-foreground">
                  {latest.intention}
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <label
                  htmlFor="wheel-history"
                  className="mb-2 block text-sm font-medium"
                >
                  Volver a una evaluación guardada
                </label>
                <Select onValueChange={openReport}>
                  <SelectTrigger id="wheel-history">
                    <SelectValue placeholder="Abrir informe personal" />
                  </SelectTrigger>
                  <SelectContent>
                    {history.map((entry) => (
                      <SelectItem key={entry.id} value={entry.id}>
                        {date(entry.created_at)}
                        {entry.id === baseline.id ? " · Punto de partida" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={() => openReport(baseline.id)}>
                <Flag size={15} /> Ver mi punto de partida
              </Button>
            </div>
          </>
        ) : (
          <div className="wheel-empty-history">
            <Sparkles size={26} />
            <p>Hoy empieza tu recorrido.</p>
            <span>
              Guarda tu primera rueda y vuelve cuando quieras. Verás tus cambios
              por área y las intenciones que te has propuesto.
            </span>
          </div>
        )}
      </section>
      <div className="ainara-note">
        <p className="font-display text-xl">
          Entre una rueda y otra, está tu día a día.
        </p>
        <p className="mt-2 text-muted-foreground">
          Anota cómo te va con tu pequeño paso. Puedes retomarlo, ajustarlo o
          elegir otro cuando lo necesites.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/reflexion">
            Ir a mi diario <ArrowRight size={16} />
          </Link>
        </Button>
      </div>
    </div>
  );
}
function SproutIcon() {
  return <AreaIcon area="growth" size={18} />;
}
