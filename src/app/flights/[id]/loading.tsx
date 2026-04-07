import { Skeleton } from "@/components/ui/skeleton";

export default function FlightDetailLoading() {
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

      <main className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
        <div className="space-y-6">
          <Skeleton className="h-4 w-28" />

          {/* Flight details card skeleton */}
          <div className="rounded-xl border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-8 w-56" />
              </div>
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-40" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-5 w-28" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-32 rounded-lg" />
            </div>
          </div>

          {/* Claim guide skeleton */}
          <div className="rounded-xl border p-6 space-y-5">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-72" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
