export function AdminLoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-[#d8e8dc]/60" />
        ))}
      </div>
      <div className="rounded-xl border border-[#d8e8dc] bg-white p-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="my-3 h-10 rounded-lg bg-[#eaf2ec]"
          />
        ))}
      </div>
    </div>
  );
}
