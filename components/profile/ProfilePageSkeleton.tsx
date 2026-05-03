/** マイページの初期表示用スケルトン（ルート loading とクライアント取得中で共通） */
export function ProfilePageSkeleton() {
  return (
    <div className="relative mx-auto min-h-screen max-w-3xl bg-[#f4f0e8] px-4 py-6 pb-24 sm:pb-8">
      <div className="space-y-4 animate-pulse">
        {/* ヘッダーカードスケルトン */}
        <div className="overflow-hidden rounded-2xl border border-[#ccc4b4]">
          <div className="h-[88px] bg-[#1e3020]" />
          <div className="flex items-center gap-2 border-t border-[#ccc4b4] bg-[#faf8f2] px-5 py-3">
            <div className="h-[34px] w-14 rounded-full bg-[#e4ede0]" />
            <div className="h-[34px] w-20 rounded-full bg-[#e4ede0]" />
            <div className="h-[34px] w-12 rounded-full bg-[#e4ede0]" />
            <div className="ml-auto h-[34px] w-20 rounded-full bg-[#e4ede0]" />
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
