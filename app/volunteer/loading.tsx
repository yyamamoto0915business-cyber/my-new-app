export default function VolunteerLoading() {
  return (
    <div className="animate-pulse">
      {/* Hero skeleton */}
      <div className="h-[200px] w-full bg-[#e8ede8] min-[900px]:h-[260px]" />
      {/* Cards skeleton */}
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[120px] rounded-xl bg-[#e8ede8]" />
        ))}
      </div>
    </div>
  );
}
