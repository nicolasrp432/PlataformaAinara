import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Skeleton */}
      <div>
        <div className="h-10 w-64 rounded-md bg-muted shimmer mb-2" />
        <div className="h-5 w-48 rounded-md bg-muted shimmer" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-border/50 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 rounded bg-muted shimmer" />
              <div className="h-4 w-4 rounded-full bg-muted shimmer" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 rounded bg-muted shimmer mb-2" />
              <div className="h-3 w-32 rounded bg-muted shimmer" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Continue Learning Skeleton */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-7 w-48 rounded bg-muted shimmer" />
            <div className="h-8 w-24 rounded bg-muted shimmer" />
          </div>

          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i} className="border-border/50 bg-card/50">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="space-y-2">
                        <div className="h-6 w-3/4 rounded bg-muted shimmer" />
                        <div className="h-4 w-1/2 rounded bg-muted shimmer" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <div className="h-3 w-16 rounded bg-muted shimmer" />
                          <div className="h-3 w-8 rounded bg-muted shimmer" />
                        </div>
                        <div className="h-2 w-full rounded bg-muted shimmer" />
                      </div>
                    </div>
                    <div className="h-10 w-32 rounded bg-muted shimmer" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity Skeleton */}
        <div className="space-y-4">
          <div className="h-7 w-40 rounded bg-muted shimmer" />
          <Card className="border-border/50 bg-card/50">
            <CardContent className="p-4">
              <div className="space-y-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted shimmer flex-shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-full rounded bg-muted shimmer" />
                      <div className="flex gap-2">
                        <div className="h-4 w-16 rounded bg-muted shimmer" />
                        <div className="h-4 w-20 rounded bg-muted shimmer" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Skeleton */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3">
              <div className="h-5 w-32 rounded bg-muted shimmer" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-10 w-full rounded bg-muted shimmer" />
              <div className="h-10 w-full rounded bg-muted shimmer" />
              <div className="h-10 w-full rounded bg-muted shimmer" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
