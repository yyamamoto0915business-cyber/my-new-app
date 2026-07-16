export default function DiscoverLoading() {
  return (
    <div className="animate-pulse mx-auto max-w-5xl px-4 py-8 space-y-4">
      <div className="h-10 w-48 rounded-lg bg-[#e8ede8]" />
      <div className="grid grid-cols-2 gap-4 min-[900px]:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[200px] rounded-xl bg-[#e8ede8]" />
        ))}
      </div>
    </div>
  );
}
