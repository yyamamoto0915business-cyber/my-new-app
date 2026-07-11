export function EventsMobileRowCardSkeleton() {
  return (
    <div className="flex items-stretch gap-3 rounded-[14px] border border-[#dde9e1] bg-white p-3 shadow-[0_2px_10px_rgba(22,56,40,0.05)]">
      <div className="h-[104px] w-[104px] shrink-0 animate-pulse rounded-[12px] bg-[#e8ebe6]" />
      <div className="relative flex flex-1 flex-col gap-2 py-0.5 pr-6">
        <div className="absolute right-0 top-0 h-7 w-7 animate-pulse rounded bg-[#e8ebe6]" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-[#e8ebe6]" />
        <div className="h-4 w-full animate-pulse rounded bg-[#e8ebe6]" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-[#e8ebe6]" />
        <div className="flex gap-1 pt-1">
          <div className="h-5 w-12 animate-pulse rounded-full bg-[#e8ebe6]" />
          <div className="h-5 w-14 animate-pulse rounded-full bg-[#e8ebe6]" />
        </div>
      </div>
    </div>
  );
}
