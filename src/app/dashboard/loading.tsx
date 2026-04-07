import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <>
      {/* Navbar skeleton */}
      <nav className="border-b px-6 py-3 flex items-center justify-between">
        <Skeleton className="h-6 w-16" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </nav>

      <main className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-8 w-32 rounded-lg" />
          </div>

          {/* Flight card skeletons */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-48" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-6 w-48" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
