function Line({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-bg-subtle ${className}`} />;
}

export function RoomGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading rooms">
      {Array.from({ length: count }, (_, index) => (
        <article key={index} className="overflow-hidden rounded-3xl border border-border-base bg-bg-elevated">
          <div className="aspect-4/3 animate-pulse bg-bg-subtle" />
          <div className="space-y-3 p-6">
            <Line className="h-3 w-20" />
            <Line className="h-8 w-3/4 rounded-xl" />
            <Line className="h-4 w-full" />
            <Line className="h-4 w-4/5" />
            <Line className="mt-6 h-11 w-32" />
          </div>
        </article>
      ))}
    </div>
  );
}

export function CheckoutSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-32 pb-24 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading checkout">
      <Line className="h-4 w-32" />
      <Line className="mt-7 h-12 w-80 max-w-full rounded-2xl" />
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5 rounded-3xl border border-border-base bg-bg-elevated p-7">
          <Line className="h-4 w-28" />
          <Line className="h-8 w-48 rounded-xl" />
          <Line className="h-12 w-full rounded-xl" />
          <Line className="h-12 w-full rounded-xl" />
          <Line className="h-28 w-full rounded-xl" />
          <Line className="h-13 w-full rounded-full" />
        </div>
        <div className="space-y-4 rounded-3xl border border-border-base bg-bg-elevated p-7">
          <Line className="h-24 w-full rounded-2xl" />
          <Line className="h-4 w-full" />
          <Line className="h-4 w-4/5" />
          <Line className="h-8 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-10" aria-busy="true" aria-label="Loading admin dashboard">
      <div className="space-y-3"><Line className="h-11 w-64 rounded-2xl" /><Line className="h-4 w-96 max-w-full" /></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-36 animate-pulse rounded-3xl border border-border-base bg-bg-elevated" />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-80 animate-pulse rounded-3xl border border-border-base bg-bg-elevated" />
        <div className="h-80 animate-pulse rounded-3xl border border-border-base bg-bg-elevated" />
      </div>
    </div>
  );
}
