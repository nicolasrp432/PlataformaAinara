import { LIFE_AREAS, type LifeWheelInput } from "@/lib/life-wheel"

export function WheelChart({ scores, previous, exportMode = false }: { scores: LifeWheelInput["scores"]; previous?: LifeWheelInput["scores"]; exportMode?: boolean }) {
  const point = (index: number, radius: number) => {
    const angle = index * Math.PI / 4 - Math.PI / 2
    return [200 + Math.cos(angle) * radius, 200 + Math.sin(angle) * radius]
  }
  const polygon = (values: LifeWheelInput["scores"]) => LIFE_AREAS.map((area, index) => point(index, values[area.key] * 13).join(",")).join(" ")
  return (
    <svg viewBox="0 0 400 400" role="img" aria-label="Gráfica de la rueda de la vida" className={`wheel-chart${exportMode ? " wheel-chart-export" : ""}`} style={exportMode ? { color: "#29251E", fontFamily: "Arial, sans-serif" } : undefined}>
      {[26, 52, 78, 104, 130].map(radius => <polygon key={radius} points={LIFE_AREAS.map((_, index) => point(index, radius).join(",")).join(" ")} fill="none" stroke={exportMode ? "#D8CFBE" : "var(--color-border)"} />)}
      {LIFE_AREAS.map((area, index) => {
        const [x, y] = point(index, 130)
        const [tx, ty] = point(index, 164)
        return <g key={area.key}><line x1="200" y1="200" x2={x} y2={y} stroke={exportMode ? "#D8CFBE" : "var(--color-border)"} /><text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fontSize="13" fontFamily={exportMode ? "Arial, sans-serif" : undefined} fill={exportMode ? "#625C52" : "var(--color-muted-foreground)"}>{["Salud", "Vínculos", "Familia", "Propósito", "Economía", "Crecimiento", "Disfrute", "Hogar"][index]}</text></g>
      })}
      {previous && <polygon points={polygon(previous)} fill="none" stroke="#6B6B6B" strokeWidth="2" strokeDasharray="5 5" />}
      <polygon points={polygon(scores)} fill="rgba(184,144,46,.16)" stroke="#B8902E" strokeWidth="2.5" strokeLinejoin="round" />
      {LIFE_AREAS.map((area, index) => { const [x, y] = point(index, scores[area.key] * 13); return <circle key={area.key} cx={x} cy={y} r="4" fill={area.color} /> })}
    </svg>
  )
}
