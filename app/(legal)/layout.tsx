import Link from "next/link"
import { BrandMark, Wordmark } from "@/components/ui/brand"

const LEGAL_NAV = [
  { href: "/legal", label: "Aviso legal" },
  { href: "/privacy", label: "Privacidad" },
  { href: "/cookies", label: "Cookies" },
  { href: "/terms", label: "Términos" },
]

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="safe-top sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark size="sm" />
            <Wordmark size="sm" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 md:py-16">{children}</main>

      <footer className="border-t border-border/60 py-8">
        <nav className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4 text-sm text-muted-foreground">
          {LEGAL_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </footer>
    </div>
  )
}
