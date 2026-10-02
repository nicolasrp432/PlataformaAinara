import { BrandLockup } from "@/components/ui/brand"
import { LIFE_AREAS, wheelAverage, type LifeWheelEntry } from "@/lib/life-wheel"
import { WheelChart } from "./wheel-chart"

const dateFormatter = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })

export function LifeWheelReport({ entry }: { entry: LifeWheelEntry }) {
  const focus = LIFE_AREAS.find(area => area.key === entry.focus)?.label ?? entry.focus
  return <article className="life-wheel-report" aria-labelledby="life-wheel-report-title">
    <header className="life-wheel-report-header">
      <BrandLockup size="md" withTagline />
      <div><p className="life-wheel-report-kicker">Informe personal</p><h1 id="life-wheel-report-title">Rueda de la vida</h1><time dateTime={entry.created_at}>{dateFormatter.format(new Date(entry.created_at))}</time></div>
    </header>
    <div className="life-wheel-report-chart"><WheelChart scores={entry.scores} exportMode /></div>
    <div className="life-wheel-report-legend"><span><i /> Evaluación guardada</span><strong>Media: {wheelAverage(entry.scores).toFixed(1)}/10</strong></div>
    <section aria-label="Puntuaciones por área" className="life-wheel-report-scores">
      {LIFE_AREAS.map(area => <div key={area.key}><span><i style={{ backgroundColor: area.color }} />{area.label}</span><strong>{entry.scores[area.key]}/10</strong></div>)}
    </section>
    <div className="life-wheel-report-reflection">
      <section><p>Área de foco</p><h2>{focus}</h2></section>
      <section><p>Mi intención</p><h2>{entry.intention}</h2></section>
    </div>
    <footer>Mitra · Una referencia personal para observar tu momento presente.</footer>
  </article>
}
