import type { NatalChartRecord, PlanetPosition } from "@/types"
import { getSignSymbol } from "@/lib/utils/astrology"

export interface NatalChartReportProps {
  chart: NatalChartRecord
  userName: string
}

const value = (input: string | null | undefined) => input?.trim() || "No disponible"
const position = (item: PlanetPosition) =>
  `${item.degree}° ${item.minutes}' · ${item.absoluteDegree}° absolutos · Casa ${item.house}${item.retrograde ? " · ℞" : ""}`

/** Informe A4 propio de Mitra; el gráfico se reconstruye con los grados guardados. */
export function NatalChartReport({ chart, userName }: NatalChartReportProps) {
  const sun = chart.planets?.find((item) => item.name === "Sol")
  const moon = chart.planets?.find((item) => item.name === "Luna")
  const planets = chart.planets ?? []
  const houses = chart.houses ?? []
  const aspects = chart.aspects ?? []

  return (
    <article id="mitra-natal-chart-report" className="mx-auto min-h-[297mm] w-[210mm] max-w-full bg-[#fffdf8] p-8 text-[#29231f] sm:p-12 print:m-0 print:w-[210mm] print:max-w-none print:p-[14mm]">
      <header className="mb-8 border-b-2 border-[#9b7653] pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#9b7653]">Mitra · Diseño cósmico</p>
        <h1 className="mt-2 font-display text-4xl text-[#37291f]">Carta natal</h1>
        <p className="mt-2 text-sm text-[#6e625a]">Informe personal de {value(userName)}</p>
      </header>

      <section className="mb-8 grid gap-6 sm:grid-cols-[1fr_190px]">
        <div>
          <ReportTitle>Datos de nacimiento</ReportTitle>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <Datum label="Fecha" value={value(chart.birth_date)} />
            <Datum label="Hora" value={value(chart.birth_time)} />
            <Datum label="Ciudad" value={value(chart.birth_city)} />
            <Datum label="País" value={value(chart.birth_country)} />
            <Datum label="Zona horaria" value={value(chart.timezone)} />
            <Datum label="Coordenadas" value={chart.latitude != null && chart.longitude != null ? `${chart.latitude}, ${chart.longitude}` : "No disponibles"} />
          </dl>
        </div>
        <ChartWheel planets={planets} houses={houses} />
      </section>

      <section className="mb-8">
        <ReportTitle>Signos principales</ReportTitle>
        <div className="grid grid-cols-3 gap-3">
          <BigThree label="Sol" sign={sun?.sign} />
          <BigThree label="Luna" sign={moon?.sign} />
          <BigThree label="Ascendente" sign={chart.ascendant?.sign} />
        </div>
      </section>

      <section className="mb-8 break-inside-avoid">
        <ReportTitle>Ángulos y posiciones planetarias</ReportTitle>
        <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
          <Angle label="Ascendente" point={chart.ascendant} />
          <Angle label="Medio Cielo" point={chart.midheaven} />
        </div>
        {planets.length ? (
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            {planets.map((planet) => <div key={planet.name} className="flex justify-between border-b border-[#ded4ca] py-1.5"><b>{planet.name} en {planet.sign}</b><span>{position(planet)}</span></div>)}
          </div>
        ) : <Empty />}
      </section>

      <section className="mb-8 grid gap-8 sm:grid-cols-2">
        <div><ReportTitle>Casas</ReportTitle>{houses.length ? houses.map((house) => <p key={house.houseNumber} className="border-b border-[#ded4ca] py-1 text-sm">Casa {house.houseNumber}: {house.sign} · {house.degree}° · {house.absoluteDegree}° absolutos</p>) : <Empty />}</div>
        <div><ReportTitle>Aspectos</ReportTitle>{aspects.length ? aspects.map((aspect, index) => <p key={`${aspect.planet1}-${aspect.planet2}-${index}`} className="border-b border-[#ded4ca] py-1 text-sm">{aspect.planet1}–{aspect.planet2}: {aspect.type} · ángulo {aspect.angle}° · orbe {aspect.orb}°</p>) : <Empty />}</div>
      </section>

      <footer className="mt-auto border-t border-[#9b7653] pt-5 text-xs leading-relaxed text-[#6e625a]">
        <p>Calculada el {chart.calculated_at ? new Date(chart.calculated_at).toLocaleString("es-ES") : "No disponible"}.</p>
        <p>Registro creado: {chart.created_at ? new Date(chart.created_at).toLocaleString("es-ES") : "No disponible"} · Última actualización: {chart.updated_at ? new Date(chart.updated_at).toLocaleString("es-ES") : "No disponible"}.</p>
        <p className="mt-2"><strong>Importante:</strong> esta carta natal es una herramienta simbólica de autoconocimiento. No sustituye asesoramiento médico, psicológico, legal ni profesional.</p>
      </footer>
    </article>
  )
}

function ChartWheel({ planets, houses }: { planets: PlanetPosition[]; houses: NatalChartRecord["houses"] }) {
  const point = (degree: number, radius: number) => {
    const angle = ((degree - 90) * Math.PI) / 180
    return { x: 100 + Math.cos(angle) * radius, y: 100 + Math.sin(angle) * radius }
  }
  return <svg viewBox="0 0 200 200" role="img" aria-label="Representación circular de la carta natal" className="h-[190px] w-[190px]">
    <circle cx="100" cy="100" r="94" fill="#faf4ea" stroke="#9b7653" strokeWidth="2" />
    <circle cx="100" cy="100" r="68" fill="none" stroke="#cbb59d" />
    {houses.map((house) => { const p = point(house.absoluteDegree, 94); return <line key={house.houseNumber} x1="100" y1="100" x2={p.x} y2={p.y} stroke="#ded4ca" /> })}
    {planets.map((planet, index) => { const p = point(planet.absoluteDegree, 79 - (index % 3) * 8); return <text key={`${planet.name}-${index}`} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="14" fill="#6f4428">{getSignSymbol(planet.sign)}</text> })}
    <circle cx="100" cy="100" r="4" fill="#9b7653" />
  </svg>
}

function ReportTitle({ children }: { children: React.ReactNode }) { return <h2 className="mb-3 font-display text-lg text-[#6f4428]">{children}</h2> }
function Datum({ label, value: content }: { label: string; value: string }) { return <div><dt className="text-xs uppercase tracking-wider text-[#8a7b70]">{label}</dt><dd className="font-medium">{content}</dd></div> }
function BigThree({ label, sign }: { label: string; sign?: string }) { return <div className="rounded-xl border border-[#cbb59d] bg-[#faf4ea] p-4 text-center"><span className="text-3xl text-[#9b7653]">{getSignSymbol(sign)}</span><p className="mt-1 text-xs uppercase tracking-wider">{label}</p><b>{sign || "No disponible"}</b></div> }
function Angle({ label, point }: { label: string; point: NatalChartRecord["ascendant"] }) { return <div className="rounded-lg bg-[#faf4ea] p-3"><b>{point?.name || label}</b><p>{point ? `${point.sign} · ${point.degree}° ${point.minutes}' · ${point.absoluteDegree}° absolutos` : "No disponible"}</p></div> }
function Empty() { return <p className="text-sm italic text-[#8a7b70]">No hay datos disponibles.</p> }
