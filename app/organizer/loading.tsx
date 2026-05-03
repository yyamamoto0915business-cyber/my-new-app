export default function OrganizerLoading() {
  return (
    <div className="mx-auto max-w-lg animate-pulse space-y-4 pb-10 sm:max-w-2xl">
      {/* ヒーローバナースケルトン */}
      <div className="h-[120px] rounded-2xl bg-[#1e3020]/80" />
      {/* CTA */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="h-14 flex-1 rounded-2xl bg-[#e4ede0]" />
        <div className="h-12 flex-1 rounded-2xl bg-[#e4ede0]" />
      </div>
      {/* グリッド */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-28 rounded-2xl bg-[#e4ede0]" />
        <div className="h-28 rounded-2xl bg-[#e4ede0]" />
      </div>
    </div>
  );
}
