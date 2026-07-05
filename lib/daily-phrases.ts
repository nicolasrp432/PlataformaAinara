/**
 * Frases diarias de Mitra. Se rota de forma determinista por día del año,
 * así el cron es idempotente y todos los usuarios reciben la misma frase.
 */
export const DAILY_PHRASES: string[] = [
  "Desde la raíz nace todo cambio verdadero.",
  "Hoy es un buen día para volver a ti.",
  "Lo que no se nombra, no se puede transformar.",
  "Tu proceso no necesita ser perfecto, solo necesita ser tuyo.",
  "Respira hondo: estás exactamente donde necesitas estar para empezar.",
  "Cada pequeña práctica diaria teje tu transformación.",
  "Escucha lo que tu emoción intenta decirte hoy.",
  "El crecimiento no es lineal; también las pausas te hacen avanzar.",
  "Ser amable contigo también es disciplina.",
  "Lo que riegas a diario, florece.",
  "Tu calma es una conquista, no una casualidad.",
  "Mirar hacia dentro es el viaje más valiente.",
  "No tienes que poder con todo hoy. Solo con lo de hoy.",
  "La constancia silenciosa vence al entusiasmo pasajero.",
  "Hoy, elige presencia antes que prisa.",
  "Tus emociones no son obstáculos: son mensajeras.",
  "Un minuto de reflexión puede cambiar la dirección del día.",
  "Agradece lo que ya eres mientras trabajas en lo que serás.",
  "Suelta lo que pesa; conserva lo que enseña.",
  "El descanso también es parte del camino.",
  "Confía en tu ritmo: nadie más puede recorrer tu proceso.",
  "Hoy puedes empezar de nuevo, sin culpa y sin prisa.",
  "Lo esencial no se ve con los ojos, se siente con atención.",
  "Cuida tus palabras internas: son la casa donde vives.",
  "Cada emoción reconocida es un paso hacia tu libertad.",
  "La claridad llega cuando te das permiso de sentir.",
  "Vuelve a tu centro: ahí está tu fuerza.",
  "Pequeños actos conscientes construyen grandes cambios.",
  "Hoy es suficiente con dar un paso sincero.",
  "Tu historia no te define; te prepara.",
  "Honra lo que has superado para abrazar lo que viene.",
  "El silencio también responde, si sabes escucharlo.",
  "Sembrar calma hoy es cosechar claridad mañana.",
  "Eres proceso, no resultado. Y eso está bien.",
  "Deja que tu curiosidad sea más grande que tu miedo.",
  "La gratitud transforma lo ordinario en suficiente.",
  "No busques ser otra persona: busca ser más tú.",
  "Cada día que vuelves a intentarlo, ya estás ganando.",
  "Tu bienestar merece un lugar en tu agenda de hoy.",
  "Las raíces crecen en silencio; tu progreso también.",
]

/** Frase determinista para una fecha dada (por día del año). */
export function phraseForDate(date: Date): string {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0)
  const dayOfYear = Math.floor((date.getTime() - start) / 86400000)
  return DAILY_PHRASES[dayOfYear % DAILY_PHRASES.length]
}
