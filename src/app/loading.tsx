export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-32 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading page">
      <div className="mx-auto max-w-2xl animate-pulse text-center">
        <div className="mx-auto h-3 w-28 rounded-full bg-bg-subtle" />
        <div className="mx-auto mt-5 h-12 w-3/4 rounded-2xl bg-bg-subtle" />
        <div className="mx-auto mt-4 h-5 w-full rounded-full bg-bg-subtle" />
        <div className="mx-auto mt-2 h-5 w-4/5 rounded-full bg-bg-subtle" />
      </div>
      <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="overflow-hidden rounded-3xl border border-border-base bg-bg-elevated">
            <div className="aspect-4/3 animate-pulse bg-bg-subtle" />
            <div className="space-y-3 p-6">
              <div className="h-3 w-20 animate-pulse rounded-full bg-bg-subtle" />
              <div className="h-8 w-3/4 animate-pulse rounded-xl bg-bg-subtle" />
              <div className="h-4 w-full animate-pulse rounded-full bg-bg-subtle" />
              <div className="h-4 w-4/5 animate-pulse rounded-full bg-bg-subtle" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
