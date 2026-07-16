export default function PassLoading() {
  return (
    <div className="animate-pulse mx-auto max-w-lg px-4 py-8 space-y-4">
      <div className="h-8 w-32 rounded-lg bg-[#e8ede8]" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-[160px] rounded-2xl bg-[#e8ede8]" />
      ))}
    </div>
  );
}
