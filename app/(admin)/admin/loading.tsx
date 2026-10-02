import { StatsSkeleton, SectionSkeleton } from "./overview-sections"
export default function AdminLoading() {
  return <div role="status" aria-label="Cargando administración" className="space-y-8"><div className="h-16 max-w-lg rounded-lg shimmer" /><StatsSkeleton /><div className="grid gap-6 lg:grid-cols-2"><div className="ainara-panel"><SectionSkeleton /></div><div className="ainara-panel"><SectionSkeleton /></div></div></div>
}
