import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Términos de Servicio",
}

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 prose prose-neutral dark:prose-invert">
      <h1>Términos de Servicio</h1>
      <p>
        Esta es una página provisional para evitar errores 404 mientras se
        completa el texto legal definitivo.
      </p>
    </main>
  )
}
