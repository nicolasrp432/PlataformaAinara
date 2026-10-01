"use client"
import { useState, useTransition } from "react"
import Link from "next/link"
import { Compass, Check, LockKeyhole } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { WheelChart } from "@/components/life-wheel/wheel-chart"
import { INITIAL_SCORES, LIFE_AREAS, wheelAverage, type LifeAreaKey, type LifeWheelEntry } from "@/lib/life-wheel"
import { saveLifeWheel } from "./actions"

export function LifeWheelClient({ entries, unavailable = false }: { entries: LifeWheelEntry[]; unavailable?: boolean }) {
  const [history, setHistory] = useState(entries)
  const [scores, setScores] = useState({ ...INITIAL_SCORES })
  const [rated, setRated] = useState<LifeAreaKey[]>([])
  const [focus, setFocus] = useState<LifeAreaKey>("health")
  const [intention, setIntention] = useState("")
  const [comparison, setComparison] = useState(entries[0]?.id ?? "none")
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const previous = history.find(entry => entry.id === comparison)
  const complete = rated.length === LIFE_AREAS.length
  const average = wheelAverage(scores)
  const update = (key: LifeAreaKey, value: number) => {
    setScores(current => ({ ...current, [key]: value }))
    setRated(current => current.includes(key) ? current : [...current, key])
    setSaved(false)
  }
  function save() {
    startTransition(async () => {
      const result = await saveLifeWheel({ scores, focus, intention })
      if (result.error) { toast.error(result.error); return }
      if (result.entry) { setHistory(current => [result.entry!, ...current].slice(0, 24)); setSaved(true); toast.success("Tu momento presente ha quedado guardado.") }
    })
  }
  return <div className="space-y-8">
    <header className="ainara-page-header"><p className="ainara-eyebrow"><Compass size={16} /> AUTOCONOCIMIENTO</p><h1>Tu vida, en perspectiva.</h1><p>No necesitas una rueda perfecta. Solo una mirada honesta a cómo estás hoy.</p></header>
    {unavailable && <p role="alert" className="rounded-xl border border-warning-border bg-warning-soft p-4 text-warning-strong">El historial no está disponible en este momento. Puedes explorar la rueda, pero el guardado está desactivado hasta que se restablezca el servicio.</p>}
    <div className="grid items-start gap-6 xl:grid-cols-[.9fr_1.1fr]">
      <section className="ainara-panel xl:sticky xl:top-8" aria-label="Tu mapa actual">
        <div className="flex items-center justify-between gap-3"><h2 className="font-display">Tu momento presente</h2><span className="ainara-chip">{rated.length}/8 áreas</span></div>
        <WheelChart scores={scores} previous={previous?.scores} />
        <div className="flex flex-wrap gap-5 text-sm"><span className="flex items-center gap-2"><span className="h-2 w-5 rounded bg-primary" /> Hoy</span>{previous && <span className="flex items-center gap-2"><span className="w-5 border-t-2 border-dashed border-[#b87732]" /> Evaluación anterior</span>}</div>
        <p className="mt-5 text-sm text-muted-foreground">{complete ? `Satisfacción media: ${average.toFixed(1)}/10. Es una referencia personal, no una calificación.` : "Los valores empiezan en 5 como guía visual. Valora o confirma cada área para completar tu mapa."}</p>
        {history.length > 0 && <div className="mt-6 space-y-2"><label htmlFor="wheel-comparison" className="text-sm font-medium">Comparar con</label><Select value={comparison} onValueChange={setComparison}><SelectTrigger id="wheel-comparison"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Sin comparación</SelectItem>{history.map(entry => <SelectItem key={entry.id} value={entry.id}>{new Date(entry.created_at).toLocaleString("es-ES", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</SelectItem>)}</SelectContent></Select></div>}
        {previous && <div className="mt-5 border-t pt-5"><p className="text-sm font-semibold">Tu intención entonces</p><p className="mt-2 break-words text-sm text-muted-foreground">{previous.intention}</p></div>}
      </section>
      <div className="space-y-6"><section className="ainara-panel"><p className="ainara-eyebrow">01 / OBSERVA</p><h2 className="font-display">¿Cómo te sientes en cada área?</h2><p className="mb-6 mt-2 text-sm text-muted-foreground">1 = muy poca satisfacción · 10 = mucha satisfacción. Mueve el control o confirma el valor actual.</p>
        <div className="space-y-6">{LIFE_AREAS.map(area => <div key={area.key} className="border-b border-border/60 pb-5 last:border-0 last:pb-0"><div className="flex items-center justify-between gap-4"><label id={`label-${area.key}`} className="flex items-center gap-2 font-medium"><span className="h-2 w-2 rounded-full" style={{ background: area.color }} />{area.label}</label><output className="font-display text-xl" aria-label={`${area.label}: ${scores[area.key]} de 10`}>{scores[area.key]}<span className="text-sm text-muted-foreground">/10</span></output></div><p className="mb-4 mt-1 text-sm text-muted-foreground">{area.question}</p><Slider aria-labelledby={`label-${area.key}`} min={1} max={10} step={1} value={[scores[area.key]]} disabled={pending} onValueChange={values => update(area.key, values[0])} /><div className="mt-3 flex justify-end"><button type="button" disabled={pending} onClick={() => update(area.key, scores[area.key])} className="flex min-h-8 items-center gap-1 text-sm font-medium text-primary">{rated.includes(area.key) ? <><Check size={14} /> Valorada</> : "Confirmar este valor"}</button></div></div>)}</div>
      </section>
      <section className="ainara-panel space-y-4"><p className="ainara-eyebrow">02 / ELIGE UN PASO</p><h2 className="font-display">Una prioridad, algo posible.</h2><label htmlFor="wheel-focus" className="block text-sm font-medium">¿A qué área quieres dedicar atención?</label><Select value={focus} disabled={pending} onValueChange={value => { setFocus(value as LifeAreaKey); setSaved(false) }}><SelectTrigger id="wheel-focus"><SelectValue /></SelectTrigger><SelectContent>{LIFE_AREAS.map(area => <SelectItem key={area.key} value={area.key}>{area.label}</SelectItem>)}</SelectContent></Select><label htmlFor="wheel-intention" className="block text-sm font-medium">Mi pequeño paso esta semana</label><Textarea id="wheel-intention" value={intention} disabled={pending} maxLength={500} onChange={event => { setIntention(event.target.value); setSaved(false) }} placeholder="Por ejemplo: reservar veinte minutos para pasear sin el móvil, tres días esta semana." rows={3} /><p className="text-sm text-muted-foreground">{intention.length}/500 · Elige algo concreto que dependa de ti.</p><Button className="w-full" onClick={save} disabled={!complete || !intention.trim() || pending || unavailable || saved}>{pending ? "Guardando…" : saved ? "Evaluación guardada" : "Guardar mi evaluación"}</Button><p className="flex items-start gap-2 text-sm text-muted-foreground"><LockKeyhole size={16} className="mt-1 shrink-0" />Esta evaluación es privada y no es un diagnóstico. Puedes repetirla cuando quieras.</p></section></div>
    </div>
    <div className="ainara-note"><p className="font-display text-xl">Dale palabras a lo que has visto.</p><p className="mt-2 text-muted-foreground">Lleva esa intención a tu diario y observa cómo se siente en tu día a día.</p><Button asChild variant="outline" className="mt-4"><Link href="/reflexion">Ir a mi diario</Link></Button></div>
  </div>
}
