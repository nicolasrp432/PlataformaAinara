/**
 * ─────────────────────────────────────────────────────────────────────────
 *  PERFIL PÚBLICO DE LA MENTORA
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Ainara es la única mentora de Mitra. Su perfil público vive aquí, en
 * código, y no en la tabla `mentors`.
 *
 * El motivo es concreto: los datos que se afirman en público —los años de
 * experiencia, sobre todo— son una declaración sobre una persona real. Si
 * salieran de una fila editable de la base de datos, una semilla antigua o un
 * cambio accidental podrían volver a publicar una cifra que no es cierta, y
 * nadie se enteraría hasta verlo en producción. Aquí queda a la vista, entra
 * en el control de versiones y se revisa en cada cambio.
 *
 * La tabla `mentors` se sigue usando para lo operativo: el id con el que se
 * crean las reservas, el precio y la duración de la sesión, y el calendario
 * de disponibilidad.
 */

export const MENTOR_PROFILE = {
  name: "Ainara",
  title: "Fundadora y mentora de Mitra",

  /** Años de acompañamiento. Cifra real, verificada con ella. */
  yearsOfExperience: 5,

  portrait: "/ainara-retrato.jpg",

  /** Frase de apertura, la que se lee primero. */
  tagline:
    "Acompaño a personas que quieren cambiar algo concreto de su vida y no saben por dónde empezar.",

  bio: "Llevo cinco años acompañando procesos de transformación personal, uno a uno. No trabajo con fórmulas: cada sesión parte de dónde estás hoy y de qué quieres que sea distinto. Mi papel es ayudarte a ver con claridad, ordenar lo que pesa y sostener el paso siguiente hasta que ya no lo necesites.",

  /** Cómo trabaja. Sustituye a la lista de etiquetas genéricas. */
  approach: [
    {
      title: "Empezamos por tu objetivo",
      description:
        "La primera sesión es para nombrar con precisión qué quieres lograr. Sin eso, todo lo demás es ruido.",
    },
    {
      title: "Un plan que cabe en tu vida",
      description:
        "Pasos pequeños y sostenibles, ajustados a tu tiempo real, no al ideal.",
    },
    {
      title: "Te acompaño hasta el final",
      description:
        "No te dejo con la teoría. Revisamos, corregimos y seguimos hasta que lo que buscabas es tuyo.",
    },
  ],

  specialties: [
    "Propósito y dirección",
    "Hábitos y constancia",
    "Gestión emocional",
    "Decisiones difíciles",
  ],
} as const

/** «5 años acompañando procesos» — una sola forma de decirlo en toda la app. */
export const MENTOR_EXPERIENCE_LABEL = `${MENTOR_PROFILE.yearsOfExperience} años acompañando procesos`
