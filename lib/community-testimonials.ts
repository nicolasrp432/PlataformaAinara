export const TESTIMONIAL_MAX_BYTES = 150 * 1024 * 1024
export const TESTIMONIAL_MAX_DURATION_SECONDS = 90
export const TESTIMONIAL_CONSENT_VERSION = "2026-10-02"
export const TESTIMONIAL_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime"] as const

export type TestimonialUploadInput = {
  fileName?: unknown
  mimeType?: unknown
  size?: unknown
  width?: unknown
  height?: unknown
  duration?: unknown
  caption?: unknown
  consent?: unknown
  peopleAuthorization?: unknown
}

export function validateTestimonialUpload(value: TestimonialUploadInput) {
  const errors: string[] = []
  const size = Number(value.size)
  const width = Number(value.width)
  const height = Number(value.height)
  const duration = Number(value.duration)
  if (typeof value.fileName !== "string" || !value.fileName.trim()) errors.push("Falta el nombre del archivo")
  if (!TESTIMONIAL_MIME_TYPES.includes(value.mimeType as typeof TESTIMONIAL_MIME_TYPES[number])) errors.push("Formato de vídeo no permitido")
  if (!Number.isFinite(size) || size <= 0 || size > TESTIMONIAL_MAX_BYTES) errors.push("El vídeo supera el límite de 150 MB")
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= width) errors.push("El vídeo debe ser vertical")
  if (!Number.isFinite(duration) || duration <= 0 || duration > TESTIMONIAL_MAX_DURATION_SECONDS) errors.push("El vídeo debe durar como máximo 90 segundos")
  if (typeof value.caption !== "string" || !value.caption.trim() || value.caption.length > 1000) errors.push("Añade un pie de vídeo de hasta 1000 caracteres")
  if (value.consent !== true) errors.push("Debes aceptar el consentimiento")
  if (value.peopleAuthorization !== true) errors.push("Debes confirmar la autorización de las personas reconocibles")
  return errors
}
