// app/admin/(authenticated)/loading.tsx
// Streaming fallback for every admin CMS route. Renders immediately while
// Prisma fetches (auth check + first DB call) so the shell feels instant.

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-8 bg-hairline ${className ?? ''}`} />;
}

export default function AuthedLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="space-y-6">
      {/* Page title placeholder */}
      <Skeleton className="h-7 w-56" />

      {/* Toolbar row */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="ml-auto h-10 w-24" />
      </div>

      {/* Main content card — table-like for list pages, full-width for editors */}
      <div className="rounded-12 border border-hairline bg-canvas p-6">
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
