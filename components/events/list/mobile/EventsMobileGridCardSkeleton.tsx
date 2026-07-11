export function EventsMobileGridCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[14px] border border-[#dde9e1] bg-white shadow-[0_2px_10px_rgba(22,56,40,0.05)]">
      <div className="aspect-[4/3] w-full animate-pulse bg-[#e8ebe6]" />
      <div className="space-y-1.5 px-2.5 pb-2.5 pt-2">
        <div className="h-2.5 w-3/4 animate-pulse rounded bg-[#e8ebe6]" />
        <div className="h-3 w-full animate-pulse rounded bg-[#e8ebe6]" />
        <div className="h-2.5 w-2/3 animate-pulse rounded bg-[#e8ebe6]" />
        <div className="flex gap-1 pt-0.5">
          <div className="h-[18px] w-10 animate-pulse rounded-full bg-[#e8ebe6]" />
          <div className="h-[18px] w-12 animate-pulse rounded-full bg-[#e8ebe6]" />
        </div>
      </div>
    </div>
  );
}
