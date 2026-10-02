import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import { natalChartMessageSchema } from "../lib/validations/natal-chart.ts"
import {
  fetchNatalChartForReport,
  natalChartPdfFilename,
  NO_SAVED_NATAL_CHART,
} from "../lib/natal-chart-report.ts"

const validData = {
  subject: { name: "Ada", birthDate: "1990-03-04", birthTime: "12:30", city: "Madrid", country: "España" },
  planets: [{ name: "Sol", sign: "Piscis", degree: 13, minutes: 2, absoluteDegree: 343.03, house: 9, retrograde: false }],
  houses: [{ houseNumber: 1, sign: "Cáncer", degree: 4, absoluteDegree: 94 }],
  aspects: [],
  ascendant: { name: "Ascendente", sign: "Cáncer", degree: 4, minutes: 0, absoluteDegree: 94 },
  midheaven: { name: "Medio Cielo", sign: "Aries", degree: 10, minutes: 0, absoluteDegree: 10 },
  calculatedAt: "2026-10-02T10:00:00.000Z",
} as const

test("valida estrictamente el mensaje recibido del iframe", () => {
  assert.equal(natalChartMessageSchema.safeParse({ type: "natal-chart-calculated", data: validData }).success, true)
  assert.equal(natalChartMessageSchema.safeParse({ type: "natal-chart-calculated", data: { ...validData, unexpected: "x" } }).success, false)
  assert.equal(natalChartMessageSchema.safeParse({ type: "natal-chart-calculated", data: { ...validData, subject: { ...validData.subject, latitude: 200 } } }).success, false)
  assert.equal(natalChartMessageSchema.safeParse({ type: "otro", data: validData }).success, false)
})

test("la exportación consulta únicamente la API autenticada propia", async () => {
  let requestedUrl = ""
  let requestedInit: RequestInit | undefined
  const record = { id: "chart", planets: [], houses: [], aspects: [] }
  const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
    requestedUrl = String(url)
    requestedInit = init
    return new Response(JSON.stringify({ data: record }), { status: 200, headers: { "Content-Type": "application/json" } })
  }
  assert.deepEqual(await fetchNatalChartForReport(fetcher as typeof fetch), record)
  assert.equal(requestedUrl, "/api/natal-chart")
  assert.equal(requestedInit?.credentials, "same-origin")
  assert.equal(requestedInit?.method, "GET")
})

test("informa de forma clara cuando todavía no existe una carta", async () => {
  const fetcher = async () => new Response(JSON.stringify({ data: null }), { status: 200 })
  await assert.rejects(() => fetchNatalChartForReport(fetcher as typeof fetch), new RegExp(NO_SAVED_NATAL_CHART))
})

test("el informe tolera campos guardados incompletos y conserva el nombre requerido", async () => {
  const source = await readFile(new URL("../components/profile/natal-chart-report.tsx", import.meta.url), "utf8")
  assert.match(source, /No disponible/)
  assert.match(source, /planets \?\? \[\]/)
  assert.match(source, /houses \?\? \[\]/)
  assert.match(source, /herramienta simbólica de autoconocimiento/)
  assert.equal(natalChartPdfFilename(new Date("2026-10-02T12:00:00Z")), "mitra-carta-natal-2026-10-02.pdf")
})

test("la API protege la privacidad y no exporta por userId ajeno", async () => {
  const source = await readFile(new URL("../app/api/natal-chart/route.ts", import.meta.url), "utf8")
  assert.match(source, /supabase\.auth\.getUser\(\)/)
  assert.match(source, /requested !== user\.id/)
  assert.match(source, /const targetId = user\.id/)
})
