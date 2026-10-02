import type { NatalChartRecord } from "@/types"

export const NO_SAVED_NATAL_CHART = "Todavía no tienes una carta natal guardada."

type NatalChartResponse = { data?: NatalChartRecord | null; error?: string }

/** Obtiene exclusivamente la carta de la sesión actual desde nuestra API. */
export async function fetchNatalChartForReport(
  fetcher: typeof fetch = fetch
): Promise<NatalChartRecord> {
  const response = await fetcher("/api/natal-chart", {
    method: "GET",
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  })
  const payload = (await response.json()) as NatalChartResponse
  if (!response.ok) throw new Error(payload.error || "No se pudo obtener la carta natal.")
  if (!payload.data) throw new Error(NO_SAVED_NATAL_CHART)
  return payload.data
}

export function natalChartPdfFilename(date = new Date()) {
  return `mitra-carta-natal-${date.toISOString().slice(0, 10)}.pdf`
}
