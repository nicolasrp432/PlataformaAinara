import { redirect } from "next/navigation"
import Link from "next/link"
import { BrandMark, Wordmark } from "@/components/ui/brand"
import { getAuthUser } from "@/lib/data-access"

export default async function BillingLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()
  if (!user) redirect("/login")

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-2xl items-center px-4">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark size="sm" />
            <Wordmark size="sm" />
          </Link>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
