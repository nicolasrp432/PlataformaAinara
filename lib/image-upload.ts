"use client"

import { createClient } from "@/lib/supabase/client"

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  SUBIDA DE IMÁGENES
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Antes las imágenes viajaban como `File` dentro de una Server Action. Eso
 * tiene dos techos que no se ven venir:
 *
 *   · Next limita el cuerpo de una Server Action (aquí subido a 10 MB), pero
 *     en Vercel la petición pasa además por el límite de la plataforma,
 *     ~4,5 MB. Una foto de móvil moderna lo supera sola, y el fallo llega
 *     como un error genérico sin pista de qué ha pasado.
 *   · La subida la hacía el cliente de Supabase del propio usuario, así que
 *     dependía de las políticas RLS del bucket. Si la migración de políticas
 *     no estaba aplicada, todas las subidas fallaban con un mensaje que no
 *     dice nada («new row violates row-level security policy»).
 *
 * Ahora el navegador reduce la imagen antes de enviarla y la sube DIRECTA a
 * Supabase Storage con una URL firmada que emite el servidor. El fichero no
 * pasa por la función serverless, así que ninguno de los dos techos aplica.
 */

/** Lado mayor al que se reduce la imagen. Suficiente para una portada. */
const MAX_EDGE = 1600
const QUALITY = 0.85

/** Techo defensivo antes de tocar el canvas: 25 MB de origen. */
const MAX_SOURCE_BYTES = 25 * 1024 * 1024

export const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/webp,image/avif,image/gif"

export class ImageUploadError extends Error {}

function extensionFor(type: string) {
  if (type === "image/webp") return "webp"
  if (type === "image/png") return "png"
  if (type === "image/avif") return "avif"
  return "jpg"
}

/**
 * Reduce y recomprime la imagen en el navegador.
 *
 * Devuelve el fichero original sin tocar si algo falla (navegador sin canvas,
 * formato que no decodifica, GIF animado): es preferible subir el original a
 * bloquear al usuario. El servidor no depende de esta optimización.
 */
export async function prepareImage(file: File): Promise<File> {
  if (file.size > MAX_SOURCE_BYTES) {
    throw new ImageUploadError(
      `La imagen pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. Usa uno de menos de 25 MB.`
    )
  }

  // Un GIF puede estar animado y el canvas se quedaría con el primer fotograma.
  if (file.type === "image/gif") return file

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))

    // Ya es pequeña y está en un formato eficiente: no se gana nada.
    if (scale === 1 && file.size < 400 * 1024) {
      bitmap.close()
      return file
    }

    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      bitmap.close()
      return file
    }
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/webp", QUALITY)
    })

    // Si el navegador no sabe codificar WebP devuelve un PNG o null; en
    // cualquier caso, solo nos quedamos con el resultado si mejora el original.
    if (!blob || blob.size >= file.size) return file

    const base = file.name.replace(/\.[^.]+$/, "")
    return new File([blob], `${base}.webp`, { type: "image/webp" })
  } catch {
    return file
  }
}

export type UploadFolder = "thumbnails/formations" | "avatars"

/**
 * Sube una imagen y devuelve su URL pública.
 * `folder` decide qué permiso exige el servidor.
 */
export async function uploadImage(
  file: File,
  folder: UploadFolder
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new ImageUploadError("El archivo tiene que ser una imagen.")
  }

  const prepared = await prepareImage(file)

  const res = await fetch("/api/upload/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      folder,
      extension: extensionFor(prepared.type),
    }),
  })

  const signed = await res.json().catch(() => null)

  if (!res.ok || !signed?.token) {
    throw new ImageUploadError(
      signed?.error ?? "No hemos podido preparar la subida. Inténtalo de nuevo."
    )
  }

  const supabase = createClient()
  const { error } = await supabase.storage
    .from(signed.bucket)
    .uploadToSignedUrl(signed.path, signed.token, prepared, {
      contentType: prepared.type,
    })

  if (error) {
    throw new ImageUploadError(`No se pudo subir la imagen: ${error.message}`)
  }

  return signed.publicUrl as string
}
