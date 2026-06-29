export default function EventsLoading() {
  return (
    <div className="hidden min-[900px]:flex min-h-screen animate-pulse">
      {/* Sidebar skeleton */}
      <div className="w-[220px] shrink-0 border-r border-[#DDE8DF] bg-white px-3 py-5 space-y-2">
        <div className="h-4 w-16 rounded bg-[#e8ede8]" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-8 rounded-[8px] bg-[#e8ede8]" />
        ))}
      </div>
      {/* Content skeleton */}
      <div className="flex-1 px-7 py-5 space-y-4">
        <div className="h-[248px] rounded-[16px] bg-[#e8ede8]" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[260px] rounded-[12px] bg-[#e8ede8]" />
          ))}
        </div>
      </div>
    </div>
  );
}
