import { cn } from "@/lib/utils"

/**
 * Envoltorio tipográfico para los documentos legales.
 *
 * El proyecto no incluye @tailwindcss/typography, así que las clases `prose`
 * que había en las páginas antiguas no aplicaban ningún estilo. Aquí el estilo
 * se define con selectores de descendiente, sin dependencias nuevas.
 */
export function LegalDoc({
  title,
  updatedAt,
  children,
}: {
  title: string
  updatedAt: string
  children: React.ReactNode
}) {
  return (
    <article
      className={cn(
        "text-foreground/90",
        "[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-foreground",
        "[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground",
        "[&_p]:mb-4 [&_p]:text-sm [&_p]:leading-relaxed sm:[&_p]:text-base",
        "[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ul]:text-sm sm:[&_ul]:text-base",
        "[&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_ol]:text-sm sm:[&_ol]:text-base",
        "[&_li]:leading-relaxed",
        "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4",
        "[&_strong]:font-semibold [&_strong]:text-foreground",
        "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.85em]",
        "[&_table]:mb-4 [&_table]:w-full [&_table]:text-left [&_table]:text-sm",
        "[&_th]:border-b [&_th]:border-border [&_th]:py-2 [&_th]:pr-4 [&_th]:font-semibold [&_th]:text-foreground",
        "[&_td]:border-b [&_td]:border-border/50 [&_td]:py-2 [&_td]:pr-4 [&_td]:align-top"
      )}
    >
      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
          Última actualización: {updatedAt}
        </p>
      </header>
      <div className="overflow-x-auto">{children}</div>
    </article>
  )
}

/**
 * Datos del responsable del tratamiento, en un solo sitio.
 *
 * Los cuatro documentos legales y la pantalla de cuenta suspendida leen de
 * aquí, así que un cambio de domicilio o de correo se hace en un único punto y
 * queda reflejado en todas partes.
 */
export const CONTROLLER = {
  name: "Ainara Unamunzaga",
  taxId: "78298690C",
  address: "Bilbao (Bizkaia), España",
  email: "info@ainaracoaching.com",
  site: "ainaracoaching.com",
  brand: "Mitra",
} as const
