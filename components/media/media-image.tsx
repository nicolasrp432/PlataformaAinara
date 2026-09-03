"use client"

import * as React from "react"
import Image, { type ImageProps } from "next/image"
import { FormationCover } from "./formation-cover"
import { resolveFormationCover } from "@/lib/formation-covers"

type MediaImageProps = Omit<ImageProps, "src" | "alt" | "onError"> & {
  src: string | null | undefined
  alt: string
  /** Semilla estable de la portada generada (slug o id). */
  seed: string
  /** Texto sobre la portada generada cuando no hay imagen. */
  title?: string | null
}

/**
 * Imagen con portada garantizada.
 *
 * `next/image` devuelve 400 cuando el host remoto no está en
 * `next.config.ts → images.remotePatterns`, y el resultado hasta ahora era un
 * hueco vacío: exactamente el síntoma de "subo una imagen desde el admin y no
 * aparece". Aquí cualquier fallo (host no permitido, 404, Storage caído) cae a
 * `FormationCover`, así que nunca se ve un hueco.
 */
export function MediaImage({ src, alt, seed, title, ...imageProps }: MediaImageProps) {
  const [failed, setFailed] = React.useState(false)

  // `seed` es el slug de la formación, así que sirve para recuperar la portada
  // que viene con el repositorio cuando la base de datos no tiene ninguna.
  const resolved = resolveFormationCover(seed, src)

  // Si cambia la fuente, se vuelve a intentar.
  React.useEffect(() => {
    setFailed(false)
  }, [resolved])

  if (!resolved || failed) {
    return <FormationCover seed={seed} title={title} />
  }

  return (
    <Image
      {...imageProps}
      src={resolved}
      alt={alt}
      onError={() => setFailed(true)}
    />
  )
}
