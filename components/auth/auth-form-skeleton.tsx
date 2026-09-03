/**
 * Esqueleto de los formularios de auth. Existe porque login y registro leen
 * `?redirect=` con `useSearchParams`, lo que obliga a una frontera de
 * Suspense: sin ella Next 15 no puede prerenderizar la página.
 */
export function AuthFormSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <div className="space-y-4" aria-hidden>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 rounded shimmer" />
          <div className="h-10 w-full rounded-lg shimmer" />
        </div>
      ))}
      <div className="h-10 w-full rounded-lg shimmer" />
    </div>
  )
}
