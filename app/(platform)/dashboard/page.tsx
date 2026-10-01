import type { Metadata } from "next"
import { Suspense } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Compass, NotebookPen, Sun } from "lucide-react"
import { getAuthUser } from "@/lib/data-access"
import { Button } from "@/components/ui/button"
import { UpsellBanner, StatsSection, StatsSkeleton, ContinueLearningSection, ContinueLearningSkeleton, ReflexionCard, ActivityCard, CardSkeleton, QuickActions } from "./sections"
import { CheckoutResultToast } from "@/components/access/checkout-result-toast"
import { createClient } from "@/lib/supabase/server"
import { LIFE_AREAS, type LifeWheelEntry } from "@/lib/life-wheel"

export const metadata: Metadata = { title: "Mi espacio", description: "Tu aprendizaje, tu diario y tu momento presente en un mismo lugar." }

async function LifeWheelSummary({ userId }: { userId: string }) {
  const supabase = await createClient()
  const { data } = await supabase.from("life_wheel_entries").select("id,scores,focus,intention,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle()
  const entry = data as LifeWheelEntry | null
  const area = LIFE_AREAS.find(area => area.key === entry?.focus)
  return <section className="ainara-wheel-summary">
    <div className="ainara-summary-icon"><Compass size={28} /></div>
    <div className="min-w-0 flex-1"><p className="ainara-eyebrow">TU RUEDA DE LA VIDA</p><h2 className="font-display text-2xl">{entry ? `Tu foco: ${area?.label ?? "tu bienestar"}` : "¿Dónde estás hoy?"}</h2><p className="mt-2 break-words text-sm text-muted-foreground">{entry ? entry.intention : "Observa ocho áreas de tu vida, elige una prioridad y transforma esa mirada en un pequeño paso."}</p>{entry && <p className="mt-2 text-xs text-muted-foreground">Última evaluación: {new Date(entry.created_at).toLocaleDateString("es-ES")}</p>}</div>
    <Button asChild variant="outline" className="shrink-0"><Link href="/rueda-de-la-vida">{entry ? "Revisar mi rueda" : "Explorar mi rueda"}</Link></Button>
  </section>
}
export default async function DashboardPage() {
  const user = await getAuthUser()
  if (!user) redirect("/login")
  const userName = user.user_metadata?.first_name || user.user_metadata?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "viajero"
  return <div className="ainara-dashboard space-y-8">
    <Suspense fallback={null}><CheckoutResultToast /></Suspense>
    <header className="ainara-page-header flex flex-wrap items-end justify-between gap-5"><div><p className="ainara-eyebrow"><Sun size={16} /> TU ESPACIO PERSONAL</p><h1>Qué bueno verte, <em>{userName}.</em></h1><p>Un paso a la vez. Hoy también cuenta.</p></div><Button asChild><Link href="/reflexion"><NotebookPen size={16} className="mr-2" />Mi reflexión de hoy</Link></Button></header>
    <Suspense fallback={<StatsSkeleton />}><StatsSection userId={user.id} /></Suspense>
    <Suspense fallback={<CardSkeleton height="h-36" />}><LifeWheelSummary userId={user.id} /></Suspense>
    <div className="grid gap-8 lg:grid-cols-3"><section className="min-w-0 space-y-5 lg:col-span-2"><div className="flex items-center justify-between gap-3"><div><p className="ainara-eyebrow">TU CAMINO</p><h2 className="font-display text-2xl">Sigue donde lo dejaste.</h2></div><Button variant="ghost" size="sm" asChild><Link href="/library">Biblioteca</Link></Button></div><Suspense fallback={<ContinueLearningSkeleton />}><ContinueLearningSection userId={user.id} /></Suspense><QuickActions /></section>
      <aside className="min-w-0 space-y-5"><div><p className="ainara-eyebrow">TU CONSTANCIA</p><h2 className="font-display text-2xl">Pequeños pasos, huella real.</h2></div><Suspense fallback={<CardSkeleton height="h-28" />}><ReflexionCard userId={user.id} /></Suspense><Suspense fallback={<CardSkeleton height="h-80" />}><ActivityCard userId={user.id} /></Suspense></aside></div>
    <Suspense fallback={null}><UpsellBanner userId={user.id} /></Suspense>
  </div>
}
