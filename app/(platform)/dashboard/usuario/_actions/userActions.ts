"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

// Zod schema for validation
const natalChartSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio."),
  birthDate: z.string().min(10, "La fecha debe ser válida (YYYY-MM-DD)."),
  birthTime: z.string().min(5, "La hora debe ser válida (HH:MM)."),
  birthCity: z.string().min(2, "La ciudad es obligatoria."),
})

export type NatalChartInput = z.infer<typeof natalChartSchema>

// Temporary specific Zodiac interfaces
export interface NatalChartResult {
  success: boolean
  sunSign?: string
  moonSign?: string
  ascendant?: string
  transformationMessage?: string
  error?: string
}

export async function processNatalChartAction(
  prevState: NatalChartResult | null,
  formData: FormData
): Promise<NatalChartResult> {
  // Simulate network delay for effect
  await new Promise((resolve) => setTimeout(resolve, 1500))

  const parsedData = natalChartSchema.safeParse({
    name: formData.get("name"),
    birthDate: formData.get("birthDate"),
    birthTime: formData.get("birthTime"),
    birthCity: formData.get("birthCity"),
  })

  if (!parsedData.success) {
    return {
      success: false,
      error: parsedData.error.errors[0]?.message || "Datos inválidos",
    }
  }

  const { birthDate } = parsedData.data

  // ---- DUMMY LOGIC PORTION ----
  // This logic should ideally be replaced with standard ephemeris or ASTRO API calculations
  const month = parseInt(birthDate.split("-")[1], 10)
  const day = parseInt(birthDate.split("-")[2], 10)
  
  let sunSign = "Aries"
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) sunSign = "Aries ♈"
  else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) sunSign = "Tauro ♉"
  else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) sunSign = "Géminis ♊"
  else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) sunSign = "Cáncer ♋"
  else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) sunSign = "Leo ♌"
  else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) sunSign = "Virgo ♍"
  else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) sunSign = "Libra ♎"
  else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) sunSign = "Escorpio ♏"
  else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) sunSign = "Sagitario ♐"
  else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) sunSign = "Capricornio ♑"
  else if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) sunSign = "Acuario ♒"
  else if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) sunSign = "Piscis ♓"

  // For demonstration, mock the others
  const ascendant = "Leo ♌" 
  const moonSign = "Escorpio ♏"

  // Transformation message based on the sign
  const transformationMessage = `El camino de ${parsedData.data.name} hacia la transformación está marcado por la energía de ${sunSign}. Confía en el proceso.`

  revalidatePath("/dashboard/usuario")

  return {
    success: true,
    sunSign,
    moonSign,
    ascendant,
    transformationMessage,
  }
}
