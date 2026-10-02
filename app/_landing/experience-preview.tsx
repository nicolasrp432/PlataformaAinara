"use client";
import { useState } from "react";
import {
  NotebookPen,
  BookOpen,
  Compass,
  LockKeyhole,
  Check,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { WheelChart } from "@/components/life-wheel/wheel-chart";
import { LIFE_AREAS, INITIAL_SCORES } from "@/lib/life-wheel";

export function ExperiencePreview() {
  const [scores, setScores] = useState({ ...INITIAL_SCORES });
  return (
    <Tabs defaultValue="diario" className="sales-preview">
      <div className="sales-preview-top">
        <span className="font-display text-xl">Tu espacio en Mitra</span>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <LockKeyhole size={14} /> Personal y privado
        </span>
      </div>
      <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-none border-b bg-transparent p-3">
        <TabsTrigger value="diario" className="gap-2">
          <NotebookPen size={16} />
          Mi diario
        </TabsTrigger>
        <TabsTrigger value="rueda" className="gap-2">
          <Compass size={16} />
          Rueda de la vida
        </TabsTrigger>
        <TabsTrigger value="camino" className="gap-2">
          <BookOpen size={16} />
          Mi aprendizaje
        </TabsTrigger>
      </TabsList>
      <TabsContent value="diario" className="m-0 p-6 sm:p-9">
        <p className="ainara-eyebrow">VOLVER A TI / CADA DÍA</p>
        <h3 className="font-display text-3xl">Un lugar para escucharte.</h3>
        <div className="my-6 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {["Radiante", "En calma", "Neutral", "Nublado", "Tormenta"].map(
            (mood, index) => (
              <span
                key={mood}
                className={`rounded-xl border px-2 py-3 text-center text-sm ${index === 1 ? "border-primary bg-primary/15 font-semibold" : "bg-background"}`}
              >
                {mood}
              </span>
            ),
          )}
        </div>
        <blockquote className="sales-paper">
          ¿Qué pequeño paso me haría sentir más cerca de mí esta semana?
        </blockquote>
        <p className="mt-5 text-sm text-muted-foreground">
          Registra tu clima emocional, escribe con preguntas guía y vuelve a tus
          entradas cuando lo necesites.
        </p>
      </TabsContent>
      <TabsContent value="rueda" className="m-0 p-6 sm:p-9">
        <div className="grid items-center gap-5 lg:grid-cols-2">
          <div>
            <p className="ainara-eyebrow">TU MOMENTO PRESENTE</p>
            <h3 className="font-display text-3xl">Prueba otra perspectiva.</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Mueve los controles y observa cómo cambia el mapa. Dentro de tu
              cuenta podrás guardar evaluaciones y comparar tu evolución.
            </p>
            <WheelChart scores={scores} />
          </div>
          <div className="space-y-5">
            {LIFE_AREAS.map((area) => (
              <div key={area.key}>
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span id={`preview-${area.key}`}>{area.label}</span>
                  <output>{scores[area.key]}/10</output>
                </div>
                <Slider
                  aria-labelledby={`preview-${area.key}`}
                  min={1}
                  max={10}
                  step={1}
                  value={[scores[area.key]]}
                  onValueChange={(value) =>
                    setScores((current) => ({
                      ...current,
                      [area.key]: value[0],
                    }))
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </TabsContent>
      <TabsContent value="camino" className="m-0 p-6 sm:p-9">
        <p className="ainara-eyebrow">APRENDER / PRACTICAR / INTEGRAR</p>
        <h3 className="font-display text-3xl">Tu camino tiene continuidad.</h3>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { title: "Una clase", body: "Mira el contenido a tu ritmo." },
            {
              title: "Una práctica",
              body: "Lleva lo aprendido a tu día a día.",
            },
            {
              title: "Tu avance",
              body: "Retoma donde lo dejaste y reconoce tus logros.",
            },
          ].map((step, index) => (
            <div
              key={step.title}
              className="rounded-xl border bg-background p-5"
            >
              <span className="font-display text-3xl text-primary-strong">
                0{index + 1}
              </span>
              <h4 className="mb-2 mt-4">{step.title}</h4>
              <p className="text-sm text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 flex items-center gap-2 text-sm text-primary-strong">
          <Check size={16} /> Progreso, logros y certificados al terminar cada
          formación.
        </p>
      </TabsContent>
      <p className="border-t px-6 py-3 text-xs text-muted-foreground">
        Vista de ejemplo. Los valores de esta demostración no se guardan.
      </p>
    </Tabs>
  );
}
