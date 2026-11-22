/**
 * 主催者の画面を読み込んでいるあいだの仮の画面。
 * いまの画面（見出し・白いカードの一覧）に近い、薄い色の形だけを出す。
 */
export default function OrganizerLoading() {
  return (
    <div
      className="mx-auto w-full max-w-[960px] space-y-4 pt-3 pb-10 motion-safe:animate-pulse"
      aria-busy
      aria-label="読み込み中"
    >
      <div className="space-y-2">
        <div className="h-3 w-24 rounded-full bg-[#eadfc4]" />
        <div className="h-7 w-48 rounded-lg bg-[#e6ece6]" />
      </div>
      <div className="h-16 rounded-2xl border border-[#e8ede8] bg-white" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-24 rounded-2xl border border-[#e8ede8] bg-white" />
        <div className="h-24 rounded-2xl border border-[#e8ede8] bg-white" />
      </div>
      <div className="h-24 rounded-2xl border border-[#e8ede8] bg-white" />
    </div>
  );
}
