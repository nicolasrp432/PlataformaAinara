import { z } from "zod"

const zodiacSign = z.enum([
  "Aries", "Tauro", "Géminis", "Cáncer",
  "Leo", "Virgo", "Libra", "Escorpio",
  "Sagitario", "Capricornio", "Acuario", "Piscis",
])

const planetPosition = z.object({
  name: z.string(),
  sign: zodiacSign,
  degree: z.number(),
  minutes: z.number(),
  absoluteDegree: z.number(),
  house: z.number(),
  retrograde: z.boolean(),
})

const houseCusp = z.object({
  houseNumber: z.number(),
  sign: zodiacSign,
  degree: z.number(),
  absoluteDegree: z.number(),
})

const anglePoint = z.object({
  name: z.string(),
  sign: zodiacSign,
  degree: z.number(),
  minutes: z.number(),
  absoluteDegree: z.number(),
})

const aspect = z.object({
  planet1: z.string(),
  planet2: z.string(),
  type: z.enum(["Conjunction", "Sextile", "Square", "Trine", "Opposition"]),
  angle: z.number(),
  orb: z.number(),
})

/** Forma exacta del payload que envía el proyecto carta-natal (NatalChartData) */
export const natalChartDataSchema = z.object({
  subject: z.object({
    name: z.string(),
    birthDate: z.string().min(1),
    birthTime: z.string().min(1),
    city: z.string().min(1),
    country: z.string(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    timezone: z.string().optional(),
  }),
  planets: z.array(planetPosition),
  houses: z.array(houseCusp),
  aspects: z.array(aspect).default([]),
  ascendant: anglePoint,
  midheaven: anglePoint,
  calculatedAt: z.string().optional(),
  chartUrl: z.string().optional(),
})

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
