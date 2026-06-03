"use client"

import { useState } from "react"
import { Star, Sparkles, ChevronDown, Sun, Moon, ArrowUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getSignSymbol, getSignElement } from "@/lib/utils/astrology"
import { NatalChartModal } from "./NatalChartModal"
import type { NatalChartRecord } from "@/types"

interface NatalChartSectionProps {
  chart: NatalChartRecord | null
  birthCity: string | null
  birthTime: string | null
  /** Fallback simple cuando aún no hay carta calculada */
  fallbackSign?: string
  fallbackSymbol?: string
  /** Nombre del usuario para la carta natal */
  userName?: string
  /** true en el perfil propio (muestra botón calcular/recalcular) */
  editable?: boolean
}

export function NatalChartSection({
  chart,
  birthCity,
  fallbackSign = "",
  fallbackSymbol = "",
  userName = "Usuario",
  editable = false,
}: NatalChartSectionProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleOpenInteractive = () => {
    if (!chart) return
    const baseUrl = process.env.NEXT_PUBLIC_CARTA_NATAL_URL || "https://carta-natal-sand.vercel.app/"
    const params = new URLSearchParams()
    params.set("name", userName)
    params.set("birthDate", chart.birth_date || "")
    params.set("birthTime", chart.birth_time || "")
    params.set("city", chart.birth_city || "")
    params.set("country", chart.birth_country || "")
    if (chart.latitude != null) params.set("latitude", String(chart.latitude))
    if (chart.longitude != null) params.set("longitude", String(chart.longitude))
    if (chart.timezone != null) params.set("timezone", chart.timezone)
    
    window.open(`${baseUrl}?${params.toString()}`, "_blank")
  }

  const sun = chart?.planets?.find((p) => p.name === "Sol")
  const moon = chart?.planets?.find((p) => p.name === "Luna")
  const asc = chart?.ascendant

  const sunSign = sun?.sign ?? fallbackSign
  const sunSymbol = sun ? getSignSymbol(sun.sign) : fallbackSymbol || getSignSymbol(fallbackSign)
  const element = getSignElement(sunSign)

  return (
    <Card className="border-border/50 shadow-md shadow-black/5 bg-card/60 backdrop-blur-md relative overflow-hidden group">
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-700 pointer-events-none" />
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-foreground flex items-center gap-2">
          <Star className="w-5 h-5 text-primary" /> Diseño Cósmico
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Resumen principal */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
            <span className="text-4xl text-primary drop-shadow-sm">{sunSymbol}</span>
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-foreground">Signo Solar {sunSign}</h3>
              {element && (
                <Badge variant="outline" className="border-primary/20 text-primary text-xs">
                  {element}
                </Badge>
              )}
            </div>
            {chart ? (
              <div className="flex flex-wrap gap-2 pt-1">
                <SignChip icon={<Sun className="w-3.5 h-3.5" />} label="Sol" value={sun?.sign} />
                <SignChip icon={<Moon className="w-3.5 h-3.5" />} label="Luna" value={moon?.sign} />
                <SignChip icon={<ArrowUp className="w-3.5 h-3.5" />} label="Ascendente" value={asc?.sign} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {birthCity ? (
                  <>Naciste en <strong>{birthCity}</strong> marcando tu entrada al sistema con una energía vital única.</>
                ) : (
                  <>Calcula tu carta natal real para descubrir tu Sol, Luna y Ascendente.</>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Detalle completo expandible */}
        {chart && (
          <div className="space-y-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((v) => !v)}
              className="gap-1.5 text-primary hover:text-primary"
            >
              {expanded ? "Ocultar carta completa" : "Ver carta natal completa"}
              <ChevronDown className={cn("w-4 h-4 transition-transform", expanded && "rotate-180")} />
            </Button>

            {expanded && (
              <div className="space-y-4 pt-1 animate-in fade-in duration-300">
                {/* Ángulos */}
                <div className="grid grid-cols-2 gap-3">
                  <AngleBox label="Ascendente" sign={asc?.sign} degree={asc?.degree} minutes={asc?.minutes} />
                  <AngleBox
                    label="Medio Cielo"
                    sign={chart.midheaven?.sign}
                    degree={chart.midheaven?.degree}
                    minutes={chart.midheaven?.minutes}
                  />
                </div>

                {/* Planetas */}
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                    Posiciones planetarias
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {chart.planets.map((p) => (
                      <div
                        key={p.name}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border/40 bg-background/40"
                      >
                        <span className="text-xl text-primary w-6 text-center shrink-0">
                          {getSignSymbol(p.sign)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-sm font-semibold text-foreground">{p.name}</span>
                            <span className="text-xs text-muted-foreground">en {p.sign}</span>
                            {p.retrograde && (
                              <span className="text-[10px] font-medium text-amber-600" title="Retrógrado">℞</span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground font-mono tabular-nums">
                            {p.degree}° {p.minutes}&apos; — Casa {p.house}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Acción: calcular / recalcular (solo perfil propio) */}
        {editable && (
          <div className="pt-1">
            <div className="flex flex-col sm:flex-row gap-3">
              {chart && (
                <Button onClick={handleOpenInteractive} className="gap-2 w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-sm hover:shadow active:scale-[0.98]">
                  <Sparkles className="w-4 h-4" />
                  Abrir Carta Interactiva (IA)
                </Button>
              )}
              <Button onClick={() => setModalOpen(true)} variant={chart ? "outline" : "default"} className="gap-2 w-full sm:w-auto">
                {chart ? "Recalcular mi carta natal" : "Calcular mi carta natal"}
              </Button>
            </div>
            {chart?.calculated_at && (
              <p className="text-[11px] text-muted-foreground mt-2">
                Calculada el{" "}
                {new Date(chart.calculated_at).toLocaleDateString("es-ES", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            )}
          </div>
        )}
      </CardContent>

      {editable && <NatalChartModal open={modalOpen} onOpenChange={setModalOpen} />}
    </Card>
  )
}

function SignChip({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs">
      <span className="text-primary">{icon}</span>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  )
}

function AngleBox({
  label, sign, degree, minutes,
}: { label: string; sign?: string; degree?: number; minutes?: number }) {
  return (
    <div className="rounded-lg border border-border/40 bg-background/40 px-4 py-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="text-lg text-primary leading-none">{getSignSymbol(sign)}</span>
      </div>
      <p className="text-sm font-semibold text-foreground">{sign ?? "—"}</p>
      {degree != null && (
        <p className="text-[11px] text-muted-foreground font-mono tabular-nums">
          {degree}° {minutes ?? 0}&apos;
        </p>
      )}
    </div>
  )
}
