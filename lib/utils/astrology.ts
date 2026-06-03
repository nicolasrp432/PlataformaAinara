export function getSunSign(birthDate: string): { sign: string; symbol: string } | null {
  const month = parseInt(birthDate.split("-")[1] || "1", 10)
  const day = parseInt(birthDate.split("-")[2] || "1", 10)

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return { sign: "Aries", symbol: "♈" }
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return { sign: "Tauro", symbol: "♉" }
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return { sign: "Géminis", symbol: "♊" }
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return { sign: "Cáncer", symbol: "♋" }
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return { sign: "Leo", symbol: "♌" }
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return { sign: "Virgo", symbol: "♍" }
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return { sign: "Libra", symbol: "♎" }
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return { sign: "Escorpio", symbol: "♏" }
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return { sign: "Sagitario", symbol: "♐" }
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return { sign: "Capricornio", symbol: "♑" }
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return { sign: "Acuario", symbol: "♒" }
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return { sign: "Piscis", symbol: "♓" }
  return null
}

const SIGN_SYMBOLS: Record<string, string> = {
  Aries: "♈", Tauro: "♉", "Géminis": "♊", "Cáncer": "♋",
  Leo: "♌", Virgo: "♍", Libra: "♎", Escorpio: "♏",
  Sagitario: "♐", Capricornio: "♑", Acuario: "♒", Piscis: "♓",
}

export function getSignSymbol(sign: string | null | undefined): string {
  if (!sign) return "✦"
  return SIGN_SYMBOLS[sign] ?? "✦"
}

const SIGN_ELEMENTS: Record<string, string> = {
  Aries: "Fuego", Leo: "Fuego", Sagitario: "Fuego",
  Tauro: "Tierra", Virgo: "Tierra", Capricornio: "Tierra",
  "Géminis": "Aire", Libra: "Aire", Acuario: "Aire",
  "Cáncer": "Agua", Escorpio: "Agua", Piscis: "Agua",
}

export function getSignElement(sign: string | null | undefined): string | null {
  if (!sign) return null
  return SIGN_ELEMENTS[sign] ?? null
}
