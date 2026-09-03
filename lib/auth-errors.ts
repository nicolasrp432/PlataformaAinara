/**
 * Traducción de los errores de Supabase Auth a mensajes que un usuario pueda
 * accionar. El texto crudo de Supabase llega en inglés y suele describir el
 * fallo técnico, no lo que la persona tiene que hacer a continuación; dejarlo
 * pasar tal cual es la causa más común de un registro abandonado.
 */

export type AuthErrorKind =
  | "invalid_credentials"
  | "email_not_confirmed"
  | "email_taken"
  | "weak_password"
  | "rate_limited"
  | "network"
  | "unknown"

export interface FriendlyAuthError {
  kind: AuthErrorKind
  message: string
}

export function describeAuthError(error: {
  message?: string
  code?: string
  status?: number
}): FriendlyAuthError {
  const code = error.code ?? ""
  const raw = (error.message ?? "").toLowerCase()

  if (code === "invalid_credentials" || raw.includes("invalid login credentials")) {
    return {
      kind: "invalid_credentials",
      message:
        "El email o la contraseña no coinciden. Revísalos, o restablece tu contraseña si no la recuerdas.",
    }
  }

  if (code === "email_not_confirmed" || raw.includes("email not confirmed")) {
    return {
      kind: "email_not_confirmed",
      message:
        "Tu email todavía no está confirmado. Te reenviamos el enlace de confirmación abajo.",
    }
  }

  if (
    code === "user_already_exists" ||
    raw.includes("already registered") ||
    raw.includes("already been registered")
  ) {
    return {
      kind: "email_taken",
      message:
        "Ya existe una cuenta con este email. Inicia sesión, o restablece la contraseña si no la recuerdas.",
    }
  }

  if (code === "weak_password" || raw.includes("password should be")) {
    return {
      kind: "weak_password",
      message: "Esa contraseña es demasiado débil. Usa al menos 8 caracteres.",
    }
  }

  if (
    error.status === 429 ||
    code === "over_email_send_rate_limit" ||
    raw.includes("rate limit") ||
    raw.includes("too many requests")
  ) {
    return {
      kind: "rate_limited",
      message:
        "Demasiados intentos seguidos. Espera un minuto y vuelve a probar.",
    }
  }

  if (raw.includes("fetch") || raw.includes("network")) {
    return {
      kind: "network",
      message:
        "No hemos podido conectar con el servidor. Comprueba tu conexión e inténtalo otra vez.",
    }
  }

  return {
    kind: "unknown",
    message:
      error.message ??
      "Algo no ha salido bien. Inténtalo de nuevo en unos segundos.",
  }
}

/** Normaliza el email tal y como lo almacena Supabase: sin espacios y en minúsculas. */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

/**
 * Detecta un `.env` sin rellenar. Sin esto el usuario ve un fallo de red
 * genérico y no sabe que el problema es de configuración, no suyo.
 */
export function supabaseEnvIsPlaceholder(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return !url || url.includes("placeholder") || url.includes("your-project")
}

export const SUPABASE_ENV_MESSAGE =
  "Entorno local sin configurar: añade tus claves reales de Supabase en .env.local, o prueba en el sitio publicado, donde ya están configuradas."
