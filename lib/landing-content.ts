/**
 * ─────────────────────────────────────────────────────────────────────────
 *  CONTENIDO DE LA PÁGINA DE VENTA
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  ⚠️  PRUEBA SOCIAL: SOLO DATOS REALES  ⚠️
 *
 *  `TESTIMONIALS` y `SOCIAL_PROOF_STATS` están vacíos A PROPÓSITO.
 *
 *  La versión anterior de la portada afirmaba «500+ estudiantes activos»,
 *  «20+ formaciones» y «98% de satisfacción». Nadie ha podido verificar esas
 *  cifras, y publicar métricas inventadas no es solo una mala práctica de
 *  marketing: en España, la Ley 3/1991 de Competencia Desleal considera
 *  desleal por engañosa la información falsa sobre las características o los
 *  resultados de un servicio. Un testimonio inventado es aún peor.
 *
 *  Las secciones que consumen estos arrays SE OCULTAN SOLAS cuando están
 *  vacíos, así que la página funciona y convierte sin ellos. En cuanto
 *  tengas testimonios reales (con permiso de la persona) y cifras que puedas
 *  respaldar, rellénalos aquí y las secciones aparecen.
 *
 *  El número de formaciones NO se escribe aquí: se cuenta de las que llegan
 *  de la base de datos, así que siempre es cierto.
 */

export interface Testimonial {
  /** Nombre real y con permiso para publicarlo. Nada de inventados. */
  name: string
  /** Contexto que hace creíble el testimonio: profesión, ciudad, edad… */
  context?: string
  /** Cita literal. No la reescribas para que suene mejor. */
  quote: string
  /** Ruta a su foto en /public. Opcional. */
  avatar?: string
  /** El cambio concreto que consiguió, si lo mencionó. */
  outcome?: string
}

/**
 * Rellena con testimonios reales. Ejemplo de la forma que deben tener:
 *
 *   {
 *     name: "…",
 *     context: "…",
 *     quote: "…",
 *     outcome: "…",
 *   }
 */
export const TESTIMONIALS: Testimonial[] = []

export interface SocialProofStat {
  /** La cifra, ya formateada. */
  value: string
  label: string
  /** De dónde sale el dato. Si no puedes responderlo, no publiques la cifra. */
  source?: string
}

/** Rellena solo con métricas que puedas respaldar. */
export const SOCIAL_PROOF_STATS: SocialProofStat[] = []

// ─────────────────────────────────────────────────────────────────────────
//  COPIA DE VENTA
// ─────────────────────────────────────────────────────────────────────────

/**
 * Señales de reconocimiento. No son características del producto: son frases
 * en las que el lector se reconoce. Una página de venta no empieza por lo que
 * vendes, empieza por lo que a la otra persona le pasa.
 */
export const PROBLEM_SIGNALS = [
  {
    title: "Empiezas cosas que no terminas",
    body: "Tres cursos a medias, dos libros por la página cuarenta y una lista de propósitos de enero que sigue intacta.",
  },
  {
    title: "Sabes el qué, no el cómo",
    body: "Tienes clarísimo lo que deberías cambiar. Lo que no aparece por ningún lado es el primer paso concreto.",
  },
  {
    title: "Aguantas dos semanas",
    body: "Arrancas con fuerza, sostienes catorce días y a la tercera semana la vida se impone y vuelves al punto de partida.",
  },
  {
    title: "Nadie te dice si vas bien",
    body: "Avanzas a ciegas. Sin nadie que conozca tu caso, cualquier duda te para durante semanas.",
  },
] as const

/** Los tres pilares. Cada uno responde a una de las señales de arriba. */
export const METHOD_PILLARS = [
  {
    step: "01",
    title: "Formaciones que se terminan",
    body: "Lecciones cortas con un ejercicio al final. No hay teoría sin una acción que hacer hoy, así que el avance se nota desde la primera clase.",
  },
  {
    step: "02",
    title: "Una mentora, no un algoritmo",
    body: "Ainara trabaja tu caso concreto en sesiones 1 a 1. Cuando te atascas, preguntas a una persona que ya sabe dónde estás.",
  },
  {
    step: "03",
    title: "Constancia que se sostiene",
    body: "Diario de reflexión diaria, rachas y una comunidad privada. Lo que sostiene un cambio no es la motivación: es no estar solo cuando se va.",
  },
] as const

/**
 * Qué incluye el PAGO ÚNICO. Se muestra junto al precio para que 337,97 € se
 * lea frente a lo que se recibe y no en el vacío.
 */
export const LIFETIME_INCLUDES = [
  {
    title: "Todas las formaciones, completas",
    body: "Cada lección de cada formación publicada. Y las que se publiquen después, sin pagar de nuevo.",
  },
  {
    title: "Para siempre, sin cuotas",
    body: "Se paga una vez. No caduca, no se renueva y no hay nada que cancelar.",
  },
  {
    title: "Comunidad privada",
    body: "Un grupo donde preguntar sin exponerte y ver que a los demás también les cuesta.",
  },
  {
    title: "Diario de reflexión",
    body: "Tu espacio privado con registro emocional para ver, en negro sobre blanco, cómo has cambiado.",
  },
  {
    title: "Asistente y seguimiento",
    body: "Resuelve dudas al momento y lleva la cuenta de tu progreso, tus rachas y tus logros.",
  },
  {
    title: "Certificados verificables",
    body: "Al terminar cada formación, un certificado que puedes compartir.",
  },
] as const

/**
 * Qué AÑADE la suscripción por encima del pago único. Deliberadamente corto:
 * si la lista repitiera lo que ya da el pago único, el lector no vería la
 * diferencia, que es justo lo que tiene que decidir.
 */
export const MEMBERSHIP_ADDS = [
  {
    title: "Mentoría 1 a 1 incluida",
    body: "Sesiones privadas con Ainara sin pagarlas aparte. Sueltas cuestan 150 € cada una, así que la cuota se cubre con menos de media sesión.",
  },
  {
    title: "Talleres en directo",
    body: "Sesiones en grupo para trabajar en vivo, con preguntas y respuestas al final.",
  },
  {
    title: "Prioridad en la agenda",
    body: "Tus sesiones se reservan antes que las de quien las paga sueltas.",
  },
] as const

/**
 * Objeciones reales. Una FAQ no está para rellenar: está para desactivar lo
 * que frena la compra en el último momento.
 */
export const FAQ = [
  {
    q: "¿337,97 € es un pago único de verdad?",
    a: "Sí. Se paga una vez y el acceso a la plataforma es permanente: no hay cuota mensual, no caduca y no hay nada que cancelar. Si más adelante publicamos formaciones nuevas, también las tienes.",
  },
  {
    q: "¿En qué se diferencia la suscripción?",
    a: "El pago único te da todo el contenido. La suscripción, 67 € al mes, añade acompañamiento: mentoría 1 a 1 con Ainara incluida y talleres en directo. Una sesión suelta cuesta 150 €, así que si vas a tener aunque sea una al mes, la cuota sale a cuenta sola. Son cosas distintas: el contenido lo estudias tú, el acompañamiento es tiempo de ella contigo.",
  },
  {
    q: "¿Tengo que contratar las dos cosas?",
    a: "No. El pago único funciona por sí solo y te deja toda la plataforma para siempre. La suscripción es opcional y puedes activarla o cancelarla cuando quieras: cancelarla nunca te quita el acceso al contenido que ya compraste.",
  },
  {
    q: "¿Y si no tengo tiempo?",
    a: "Las lecciones son cortas y cada una se cierra con un ejercicio concreto. No hace falta reservar una tarde: hace falta un rato constante. Además el acceso no caduca, así que avanzas a tu ritmo y retomas donde lo dejaste sin perder nada.",
  },
  {
    q: "¿Cómo sé si esto es para mí antes de pagar?",
    a: "La primera clase de cada formación es gratis y no pide tarjeta. Te registras, las ves enteras y decides con criterio en vez de con una promesa.",
  },
  {
    q: "¿Qué pasa justo después de pagar?",
    a: "El acceso se abre en el mismo momento en que Stripe confirma el pago. No hay cola de aprobación ni espera: vuelves a la plataforma y todo el contenido está desbloqueado.",
  },
  {
    q: "¿Esto es terapia?",
    a: "No. Es formación y acompañamiento para avanzar hacia objetivos concretos. Si atraviesas una situación que necesita atención clínica, lo que corresponde es un profesional de la salud mental, y Ainara te lo dirá.",
  },
  {
    q: "¿Puedo pagar desde fuera de España?",
    a: "Sí. El cobro lo procesa Stripe y admite tarjetas internacionales. El importe está en euros.",
  },
] as const
