export function EventsMobileRowCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-[#E8EAE6] bg-white p-3">
      <div className="h-[108px] w-[118px] shrink-0 animate-pulse rounded-[12px] bg-[#EDECE8]" />
      <div className="flex flex-1 flex-col justify-center gap-2 py-1">
        <div className="h-3 w-2/3 animate-pulse rounded bg-[#EDECE8]" />
        <div className="h-4 w-full animate-pulse rounded bg-[#EDECE8]" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-[#EDECE8]" />
        <div className="flex gap-1">
          <div className="h-5 w-12 animate-pulse rounded-full bg-[#EDECE8]" />
          <div className="h-5 w-14 animate-pulse rounded-full bg-[#EDECE8]" />
        </div>
      </div>
    </div>
  );
}
