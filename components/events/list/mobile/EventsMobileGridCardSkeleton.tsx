export function EventsMobileGridCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[8px] border border-[#E8EBE6] bg-white shadow-[0_1px_4px_rgba(15,23,42,0.04)]">
      <div className="aspect-video w-full animate-pulse bg-[#E8EBE6]" />
      <div className="space-y-1 px-1.5 py-1">
        <div className="h-2 w-3/4 animate-pulse rounded bg-[#E8EBE6]" />
        <div className="h-2.5 w-full animate-pulse rounded bg-[#E8EBE6]" />
        <div className="h-2 w-2/3 animate-pulse rounded bg-[#E8EBE6]" />
        <div className="flex gap-0.5 pt-px">
          <div className="h-4 w-9 animate-pulse rounded-full bg-[#E8EBE6]" />
          <div className="h-4 w-10 animate-pulse rounded-full bg-[#E8EBE6]" />
        </div>
      </div>
    </div>
  );
}
