export default function HomeLoading() {
  return (
    <div className="mx-auto hidden max-w-[1280px] animate-pulse space-y-4 px-8 py-4 min-[900px]:block">
      {/* Hero skeleton */}
      <div className="h-[248px] rounded-[16px] bg-[#e8ede8]" />
      {/* Filters skeleton */}
      <div className="h-[96px] rounded-[16px] bg-[#e8ede8]" />
      {/* Cards skeleton */}
      <div className="grid grid-cols-5 gap-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[220px] rounded-[12px] bg-[#e8ede8]" />
        ))}
      </div>
    </div>
  );
}
