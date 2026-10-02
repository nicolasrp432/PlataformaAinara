import { z } from "zod"

const zodiacSign = z.enum([
  "Aries", "Tauro", "Géminis", "Cáncer",
  "Leo", "Virgo", "Libra", "Escorpio",
  "Sagitario", "Capricornio", "Acuario", "Piscis",
])

const finiteDegree = z.number().finite().min(0).max(360)
const degreeInSign = z.number().int().min(0).max(29)
const minutes = z.number().int().min(0).max(59)

const planetPosition = z.object({
  name: z.string().min(1).max(80),
  sign: zodiacSign,
  degree: degreeInSign,
  minutes,
  absoluteDegree: finiteDegree,
  house: z.number().int().min(1).max(12),
  retrograde: z.boolean(),
}).strict()

const houseCusp = z.object({
  houseNumber: z.number().int().min(1).max(12),
  sign: zodiacSign,
  degree: degreeInSign,
  absoluteDegree: finiteDegree,
}).strict()

const anglePoint = z.object({
  name: z.string().min(1).max(80),
  sign: zodiacSign,
  degree: degreeInSign,
  minutes,
  absoluteDegree: finiteDegree,
}).strict()

const aspect = z.object({
  planet1: z.string().min(1).max(80),
  planet2: z.string().min(1).max(80),
  type: z.enum(["Conjunction", "Sextile", "Square", "Trine", "Opposition"]),
  angle: finiteDegree,
  orb: z.number().finite().min(0).max(20),
}).strict()

/** Forma exacta del payload que envía el proyecto carta-natal (NatalChartData) */
export const natalChartDataSchema = z.object({
  subject: z.object({
    name: z.string().min(1).max(120),
    birthDate: z.string().date(),
    birthTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/),
    city: z.string().min(1).max(160),
    country: z.string().max(120),
    latitude: z.number().finite().min(-90).max(90).optional(),
    longitude: z.number().finite().min(-180).max(180).optional(),
    timezone: z.string().min(1).max(80).optional(),
  }).strict(),
  planets: z.array(planetPosition).max(40),
  houses: z.array(houseCusp).max(12),
  aspects: z.array(aspect).max(400).default([]),
  ascendant: anglePoint,
  midheaven: anglePoint,
  calculatedAt: z.string().datetime({ offset: true }).optional(),
  chartUrl: z.string().url().max(2048).optional(),
}).strict()

/** Contrato completo aceptado desde el iframe. Nunca se confía en un cast. */
export const natalChartMessageSchema = z.object({
  type: z.literal("natal-chart-calculated"),
  data: natalChartDataSchema,
}).strict()

export type NatalChartDataInput = z.infer<typeof natalChartDataSchema>

/** Convierte el payload de carta-natal a la fila de la tabla natal_charts */
export function toNatalChartRow(userId: string, data: NatalChartDataInput) {
  const sun = data.planets.find((p) => p.name === "Sol")
  const moon = data.planets.find((p) => p.name === "Luna")

  return {
    row: {
      user_id: userId,
      birth_date: data.subject.birthDate,
      birth_time: data.subject.birthTime,
      birth_city: data.subject.city,
      birth_country: data.subject.country || null,
      latitude: data.subject.latitude ?? null,
      longitude: data.subject.longitude ?? null,
      timezone: data.subject.timezone ?? null,
      planets: data.planets,
      houses: data.houses,
      aspects: data.aspects,
      ascendant: data.ascendant,
      midheaven: data.midheaven,
      calculated_at: data.calculatedAt ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    derived: {
      sun_sign: sun?.sign ?? null,
      moon_sign: moon?.sign ?? null,
      rising_sign: data.ascendant?.sign ?? null,
    },
  }
}
