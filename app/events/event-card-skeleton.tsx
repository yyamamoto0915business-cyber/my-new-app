export function EventCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200/90 bg-white shadow-[0_4px_14px_rgba(15,23,42,0.05)]">
      <div className="aspect-[16/9] w-full animate-pulse bg-slate-100" />
      <div className="p-4">
        <div className="flex gap-2">
          <div className="h-8 w-16 animate-pulse rounded-full bg-slate-100" />
          <div className="h-8 w-20 animate-pulse rounded-full bg-slate-100" />
        </div>
        <div className="mt-3 h-5 w-4/5 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-4 w-full animate-pulse rounded bg-slate-100" />
        <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-slate-100" />
        <div className="mt-4 space-y-2">
          <div className="h-4 w-3/5 animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-2/5 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="mt-4 flex gap-3">
          <div className="h-11 flex-1 animate-pulse rounded-full bg-slate-100" />
          <div className="h-11 w-20 animate-pulse rounded-full bg-slate-50" />
        </div>
      </div>
    </div>
  );
}
