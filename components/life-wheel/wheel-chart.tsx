import {
  LIFE_AREAS,
  type LifeAreaKey,
  type LifeWheelInput,
} from "@/lib/life-wheel";

export function WheelChart({
  scores,
  previous,
  rated,
  active,
  exportMode = false,
}: {
  scores: LifeWheelInput["scores"];
  previous?: LifeWheelInput["scores"];
  rated?: LifeAreaKey[];
  active?: LifeAreaKey;
  exportMode?: boolean;
}) {
  const point = (index: number, radius: number) => {
    const angle = (index * Math.PI) / 4 - Math.PI / 2;
    return [200 + Math.cos(angle) * radius, 200 + Math.sin(angle) * radius];
  };
  const polygon = (values: LifeWheelInput["scores"]) =>
    LIFE_AREAS.map((area, index) =>
      point(index, values[area.key] * 12).join(","),
    ).join(" ");
  const isRated = (key: LifeAreaKey) => !rated || rated.includes(key);
  const complete = LIFE_AREAS.every((area) => isRated(area.key));
  return (
    <svg
      viewBox="0 0 400 400"
      role="img"
      aria-label="Gráfica de la rueda de la vida"
      className={`wheel-chart${exportMode ? " wheel-chart-export" : ""}`}
      style={
        exportMode
          ? { color: "#29251E", fontFamily: "Arial, sans-serif" }
          : undefined
      }
    >
      <title>
        Tu satisfacción en ocho áreas, del centro (0) al exterior (10)
      </title>
      <desc>
        {LIFE_AREAS.map(
          (area) =>
            `${area.label}: ${isRated(area.key) ? `${scores[area.key]} de 10` : "por valorar"}`,
        ).join(". ")}
        {previous
          ? ". La línea discontinua representa la evaluación de referencia."
          : ""}
      </desc>
      {LIFE_AREAS.map((area, index) => {
        const [x1, y1] = point(index - 0.5, 120);
        const [x2, y2] = point(index + 0.5, 120);
        const radius = isRated(area.key) ? scores[area.key] * 12 : 0;
        const [vx1, vy1] = point(index - 0.5, radius);
        const [vx2, vy2] = point(index + 0.5, radius);
        return (
          <g key={area.key}>
            <path
              d={`M200 200 L${x1} ${y1} A120 120 0 0 1 ${x2} ${y2} Z`}
              fill={area.color}
              fillOpacity={active === area.key ? 0.16 : 0.055}
              stroke={area.color}
              strokeOpacity=".15"
            />
            {radius > 0 && (
              <path
                d={`M200 200 L${vx1} ${vy1} A${radius} ${radius} 0 0 1 ${vx2} ${vy2} Z`}
                fill={area.color}
                fillOpacity=".26"
              />
            )}
          </g>
        );
      })}
      {[24, 48, 72, 96, 120].map((radius) => (
        <circle
          key={radius}
          cx="200"
          cy="200"
          r={radius}
          fill="none"
          stroke={exportMode ? "#D8CFBE" : "currentColor"}
          strokeOpacity=".18"
        />
      ))}
      {previous && (
        <polygon
          points={polygon(previous)}
          fill="none"
          stroke="#76716B"
          strokeWidth="2"
          strokeDasharray="5 5"
        />
      )}
      {complete && (
        <polygon
          points={polygon(scores)}
          fill="none"
          stroke="#425C59"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      )}
      {[2, 4, 6, 8, 10].map((value) => (
        <text
          key={value}
          x="204"
          y={200 - value * 12 + 4}
          fontSize="9"
          fill={exportMode ? "#625C52" : "currentColor"}
        >
          {value}
        </text>
      ))}
      {LIFE_AREAS.map((area, index) => {
        const [tx, ty] = point(index, 158);
        const [x, y] = point(index, scores[area.key] * 12);
        return (
          <g key={area.key}>
            <text
              x={tx}
              y={ty - 5}
              textAnchor="middle"
              fontSize="12"
              fontWeight="600"
              fill={area.color}
            >
              {
                [
                  "Salud",
                  "Vínculos",
                  "Familia",
                  "Propósito",
                  "Economía",
                  "Crecimiento",
                  "Disfrute",
                  "Hogar",
                ][index]
              }
            </text>
            <text
              x={tx}
              y={ty + 12}
              textAnchor="middle"
              fontSize="11"
              fill={exportMode ? "#625C52" : "currentColor"}
            >
              {isRated(area.key) ? `${scores[area.key]}/10` : "·"}
            </text>
            {isRated(area.key) && (
              <circle
                cx={x}
                cy={y}
                r={active === area.key ? 6 : 4}
                fill={area.color}
                stroke="white"
                strokeWidth="2"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
