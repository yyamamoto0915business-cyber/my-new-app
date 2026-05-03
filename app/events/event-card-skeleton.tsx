export function EventCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[20px] border border-[#ccc4b4] bg-[#faf8f2]">
      <div className="aspect-[16/9] w-full animate-pulse bg-[#e4ede0]" />
      <div className="p-4">
        <div className="flex gap-1.5">
          <div className="h-7 w-14 animate-pulse rounded-full bg-[#e4ede0]" />
          <div className="h-7 w-18 animate-pulse rounded-full bg-[#e4ede0]" />
        </div>
        <div className="mt-2.5 h-5 w-4/5 animate-pulse rounded bg-[#d8e8d4]" />
        <div className="mt-1.5 h-4 w-full animate-pulse rounded bg-[#e4ede0]" />
        <div className="mt-1.5 h-4 w-2/3 animate-pulse rounded bg-[#e4ede0]" />
        <div className="mt-3 space-y-1.5">
          <div className="h-4 w-3/5 animate-pulse rounded bg-[#e4ede0]" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-[#e4ede0]" />
          <div className="h-4 w-2/5 animate-pulse rounded bg-[#e4ede0]" />
        </div>
        <div className="mt-3.5">
          <div className="h-10 w-full animate-pulse rounded-full bg-[#e4ede0]" />
        </div>
      </div>
    </div>
  );
}
