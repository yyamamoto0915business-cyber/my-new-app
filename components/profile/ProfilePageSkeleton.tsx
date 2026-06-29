/** マイページの初期表示用スケルトン（ルート loading とクライアント取得中で共通） */
export function ProfilePageSkeleton() {
  return (
    <div className="relative mx-auto min-h-screen w-full max-w-screen-sm bg-[#EDECE7] px-4 py-4 pb-24 sm:pb-8">
      <div className="space-y-3 animate-pulse">
        {/* ヘッダーカードスケルトン */}
        <div className="overflow-hidden rounded-xl border border-[#ccc4b4]">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="h-10 w-10 shrink-0 rounded-full bg-[#2B3A6B]/40" />
            <div className="flex-1 space-y-2">
              <div className="h-2 w-12 rounded bg-[#d8e8d4]" />
              <div className="h-4 w-28 rounded bg-[#e4ede0]" />
              <div className="h-2.5 w-36 rounded bg-[#e4ede0]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="h-6 w-10 rounded-full bg-[#e4ede0]" />
              <div className="h-6 w-14 rounded-full bg-[#e4ede0]" />
            </div>
          </div>
        </div>
        {/* グリッドスケルトン */}
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 rounded-2xl bg-[#e4ede0]" />
          <div className="h-24 rounded-2xl bg-[#e4ede0]" />
          <div className="h-24 rounded-2xl bg-[#e4ede0]" />
          <div className="h-24 rounded-2xl bg-[#e4ede0]" />
        </div>
        {/* コンテンツスケルトン */}
        <div className="space-y-2">
          <div className="h-3 w-20 rounded bg-[#d8e8d4]" />
          <div className="h-32 rounded-2xl bg-[#e4ede0]" />
        </div>
      </div>
    </div>
  );
}
