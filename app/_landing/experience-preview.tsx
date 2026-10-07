"use client";
import { useState } from "react";
import {
  NotebookPen,
  BookOpen,
  Compass,
  LockKeyhole,
  Check,
  Sparkles,
  Sun,
  Moon,
  ArrowUp,
  FileDown,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { WheelChart } from "@/components/life-wheel/wheel-chart";
import { LIFE_AREAS, INITIAL_SCORES } from "@/lib/life-wheel";

const BIG_THREE_DATA = {
  sol: {
    title: "Sol en Escorpio",
    symbol: "☉",
    signSymbol: "♏",
    degree: "24° 15'",
    area: "Casa VIII · Transformación",
    role: "Identidad y núcleo vital",
    question: "¿Qué verdades profundas necesitas reconocer para dar el siguiente paso?",
    description:
      "Capacidad de introspección, deseo de ir a la raíz de las cosas y fortaleza para regenerarte tras los cambios.",
  },
  luna: {
    title: "Luna en Piscis",
    symbol: "☽",
    signSymbol: "♓",
    degree: "12° 40'",
    area: "Casa XII · Espacio interior",
    role: "Mundo emocional y descanso",
    question: "¿Qué espacio de silencio o creatividad te permite recargar hoy tu energía?",
    description:
      "Sensibilidad intuitiva, empatía profunda y necesidad de momentos de retiro para procesar lo vivido.",
  },
  ascendente: {
    title: "Ascendente en Tauro",
    symbol: "⇡",
    signSymbol: "♉",
    degree: "08° 22'",
    area: "Casa I · Presencia",
    role: "Mirada y ritmo en la vida",
    question: "¿Cómo puedes construir hábitos sostenibles sin exigirte ritmos que no te pertenecen?",
    description:
      "Búsqueda de calma, disfrute sensorial y construcción paso a paso con bases firmes.",
  },
};

function NatalWheelSvg({ activePoint }: { activePoint: "sol" | "luna" | "ascendente" }) {
  const points = {
    sol: { angle: 220, r: 76, label: "☉ Sol" },
    luna: { angle: 330, r: 76, label: "☽ Luna" },
    ascendente: { angle: 180, r: 88, label: "⇡ Asc" },
  };

  const toCoords = (deg: number, rad: number) => {
    const rads = ((deg - 90) * Math.PI) / 180;
    return { x: 100 + Math.cos(rads) * rad, y: 100 + Math.sin(rads) * rad };
  };

  const solPos = toCoords(points.sol.angle, points.sol.r);
  const lunaPos = toCoords(points.luna.angle, points.luna.r);
  const ascPos = toCoords(points.ascendente.angle, points.ascendente.r);

  const signs = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

  return (
    <div className="relative flex items-center justify-center">
      <svg
        viewBox="0 0 200 200"
        className="h-56 w-56 sm:h-64 sm:w-64 select-none drop-shadow-md"
        role="img"
        aria-label="Rueda astrológica de ejemplo con Sol, Luna y Ascendente"
      >
        {/* Anillo exterior */}
        <circle cx="100" cy="100" r="95" fill="#FAF6EE" stroke="#B8902E" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="82" fill="none" stroke="#D8CFBE" strokeWidth="1" strokeDasharray="2 2" />
        <circle cx="100" cy="100" r="62" fill="#FFFDF8" stroke="#D8CFBE" strokeWidth="1" />
        <circle cx="100" cy="100" r="28" fill="#F4EDE0" stroke="#B8902E" strokeWidth="1.2" />

        {/* Rayos de las 12 casas */}
        {Array.from({ length: 12 }).map((_, i) => {
          const { x, y } = toCoords(i * 30, 95);
          return (
            <line
              key={i}
              x1="100"
              y1="100"
              x2={x}
              y2={y}
              stroke="#E8E0D2"
              strokeWidth={i % 3 === 0 ? "1.5" : "0.75"}
            />
          );
        })}

        {/* Glifos de los 12 signos en el anillo exterior */}
        {signs.map((sign, i) => {
          const { x, y } = toCoords(i * 30 + 15, 88);
          return (
            <text
              key={sign}
              x={x}
              y={y}
              fontSize="8.5"
              fill="#8A8272"
              textAnchor="middle"
              dominantBaseline="middle"
              className="font-serif"
            >
              {sign}
            </text>
          );
        })}

        {/* Líneas de aspectos interiores */}
        <line
          x1={solPos.x}
          y1={solPos.y}
          x2={lunaPos.x}
          y2={lunaPos.y}
          stroke="#F6D25C"
          strokeWidth="1.2"
          opacity="0.8"
        />
        <line
          x1={solPos.x}
          y1={solPos.y}
          x2={ascPos.x}
          y2={ascPos.y}
          stroke="#D8CFBE"
          strokeWidth="1"
          opacity="0.6"
        />

        {/* Nodo Sol */}
        <g className="transition-all duration-300">
          <circle
            cx={solPos.x}
            cy={solPos.y}
            r={activePoint === "sol" ? "9" : "6.5"}
            fill={activePoint === "sol" ? "#F6D25C" : "#E5B942"}
            stroke="#29251E"
            strokeWidth="1.5"
          />
          <text
            x={solPos.x}
            y={solPos.y}
            fontSize={activePoint === "sol" ? "8" : "7"}
            fontWeight="bold"
            fill="#29251E"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            ☉
          </text>
        </g>

        {/* Nodo Luna */}
        <g className="transition-all duration-300">
          <circle
            cx={lunaPos.x}
            cy={lunaPos.y}
            r={activePoint === "luna" ? "9" : "6.5"}
            fill={activePoint === "luna" ? "#FFE885" : "#D4C7B0"}
            stroke="#29251E"
            strokeWidth="1.5"
          />
          <text
            x={lunaPos.x}
            y={lunaPos.y}
            fontSize={activePoint === "luna" ? "8" : "7"}
            fontWeight="bold"
            fill="#29251E"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            ☽
          </text>
        </g>

        {/* Nodo Ascendente */}
        <g className="transition-all duration-300">
          <circle
            cx={ascPos.x}
            cy={ascPos.y}
            r={activePoint === "ascendente" ? "9" : "6.5"}
            fill={activePoint === "ascendente" ? "#B8902E" : "#8A8272"}
            stroke="#FFFDF8"
            strokeWidth="1.5"
          />
          <text
            x={ascPos.x}
            y={ascPos.y}
            fontSize={activePoint === "ascendente" ? "8" : "7"}
            fontWeight="bold"
            fill="#FFFDF8"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            ⇡
          </text>
        </g>

        {/* Centro de la rueda */}
        <circle cx="100" cy="100" r="12" fill="#29251E" />
        <circle cx="100" cy="100" r="3" fill="#F6D25C" />
      </svg>
    </div>
  );
}

export function ExperiencePreview() {
  const [scores, setScores] = useState({ ...INITIAL_SCORES });
  const [activePoint, setActivePoint] = useState<"sol" | "luna" | "ascendente">("sol");

  const currentPoint = BIG_THREE_DATA[activePoint];

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
        <TabsTrigger value="carta" className="gap-2">
          <Sparkles size={16} />
          Carta natal
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

      {/* Vista previa de Carta Natal */}
      <TabsContent value="carta" className="m-0 p-6 sm:p-9">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="ainara-eyebrow">DISEÑO CÓSMICO / MAPA PERSONAL</p>
            <h3 className="font-display text-3xl">Símbolos para escucharte.</h3>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Calculada a partir de tu fecha, hora y ciudad natal para descubrir
              tus tres pilares fundamentales. Planteada como espejo simbólico y
              reflexión personal.
            </p>

            <div className="mt-6 flex flex-col items-center sm:flex-row sm:justify-start gap-4">
              <NatalWheelSvg activePoint={activePoint} />
              <div className="text-xs text-muted-foreground space-y-1">
                <span className="block font-semibold text-foreground">Puntos clave:</span>
                <span className="flex items-center gap-1.5"><span className="text-amber-500 font-bold">☉</span> Sol (Esencia)</span>
                <span className="flex items-center gap-1.5"><span className="text-amber-400 font-bold">☽</span> Luna (Emoción)</span>
                <span className="flex items-center gap-1.5"><span className="text-amber-700 font-bold">⇡</span> Ascendente (Proyección)</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Selector de los Big Three */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActivePoint("sol")}
                className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all ${
                  activePoint === "sol"
                    ? "border-primary bg-primary/20 shadow-sm"
                    : "border-border/60 bg-background hover:bg-muted/40"
                }`}
              >
                <Sun className={`h-4 w-4 ${activePoint === "sol" ? "text-amber-600" : "text-muted-foreground"}`} />
                <span className="text-xs font-bold text-foreground">Sol</span>
                <span className="text-[11px] text-muted-foreground font-mono">Escorpio</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePoint("luna")}
                className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all ${
                  activePoint === "luna"
                    ? "border-primary bg-primary/20 shadow-sm"
                    : "border-border/60 bg-background hover:bg-muted/40"
                }`}
              >
                <Moon className={`h-4 w-4 ${activePoint === "luna" ? "text-amber-500" : "text-muted-foreground"}`} />
                <span className="text-xs font-bold text-foreground">Luna</span>
                <span className="text-[11px] text-muted-foreground font-mono">Piscis</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePoint("ascendente")}
                className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all ${
                  activePoint === "ascendente"
                    ? "border-primary bg-primary/20 shadow-sm"
                    : "border-border/60 bg-background hover:bg-muted/40"
                }`}
              >
                <ArrowUp className={`h-4 w-4 ${activePoint === "ascendente" ? "text-amber-700" : "text-muted-foreground"}`} />
                <span className="text-xs font-bold text-foreground">Ascendente</span>
                <span className="text-[11px] text-muted-foreground font-mono">Tauro</span>
              </button>
            </div>

            {/* Tarjeta de interpretación del punto activo */}
            <div className="rounded-2xl border border-primary/30 bg-secondary/50 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
                    {currentPoint.role}
                  </span>
                  <h4 className="font-display text-xl text-foreground flex items-center gap-2">
                    <span>{currentPoint.symbol}</span>
                    <span>{currentPoint.title}</span>
                  </h4>
                </div>
                <span className="rounded-full bg-background border px-2.5 py-1 text-xs font-mono font-medium text-foreground">
                  {currentPoint.degree}
                </span>
              </div>

              <p className="text-sm text-foreground/90 leading-relaxed">
                {currentPoint.description}
              </p>

              <blockquote className="rounded-xl border border-primary/20 bg-background/80 p-3 text-xs italic text-amber-950 font-serif">
                «{currentPoint.question}»
              </blockquote>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {currentPoint.area}
                </span>
                <span className="flex items-center gap-1">
                  <FileDown className="h-3.5 w-3.5 text-primary-strong" />
                  Informe imprimible y PDF en tu cuenta
                </span>
              </div>
            </div>
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
        Vista de ejemplo. Dentro de tu cuenta podrás guardar evaluaciones y calcular tu carta natal completa.
      </p>
    </Tabs>
  );
}
