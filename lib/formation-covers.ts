/**
 * Portadas que viajan con el repositorio.
 *
 * Son las portadas oficiales de los programas, entregadas como archivo y
 * guardadas en `public/`. La fuente de verdad sigue siendo
 * `formations.thumbnail_url`: este mapa solo actúa cuando esa columna está
 * vacía, de modo que en cuanto alguien suba una portada desde el panel, esa
 * gana.
 *
 * Existe porque una portada que ya está en el repositorio no debería depender
 * de que se ejecute una migración para verse. Si más adelante todas las
 * portadas se gestionan desde el panel, este mapa se queda vacío y no molesta.
 *
 * Las claves son el `slug` de la formación, normalizado igual que la función
 * de abajo (sin acentos, en minúsculas), para que una diferencia de tilde no
 * deje la portada fuera.
 */
const LOCAL_COVERS: Record<string, string> = {
  "re-conecta": "/re-conectate-portada.png",
  "re-conectate": "/re-conectate-portada.png",
  "emulsion-energetica": "/emulsion-energetica.png",
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

/**
 * Devuelve la portada a usar: la de la base de datos si existe, si no la que
 * viene con el repositorio, y si tampoco, `null` para que
 * `MediaImage` dibuje la portada generada.
 */
export function resolveFormationCover(
  slug: string | null | undefined,
  thumbnailUrl: string | null | undefined
): string | null {
  if (thumbnailUrl) return thumbnailUrl
  if (!slug) return null
  return LOCAL_COVERS[normalize(slug)] ?? null
}
