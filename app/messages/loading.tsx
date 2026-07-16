export default function MessagesLoading() {
  return (
    <div className="animate-pulse flex h-full">
      <div className="w-full max-w-sm border-r border-[#e8ede8] space-y-3 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-3 items-center">
            <div className="h-12 w-12 shrink-0 rounded-full bg-[#e8ede8]" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-28 rounded bg-[#e8ede8]" />
              <div className="h-3 w-40 rounded bg-[#e8ede8]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
