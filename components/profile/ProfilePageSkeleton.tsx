/** マイページの初期表示用スケルトン（ルート loading とクライアント取得中で共通） */
export function ProfilePageSkeleton() {
  return (
    <div className="mg-profile-mobile-page relative mx-auto min-h-screen w-full max-w-screen-sm px-4 py-4 pb-24 sm:pb-8">
      <div className="space-y-3 animate-pulse">
        <div className="overflow-hidden rounded-[14px] border border-[#e8e6e0] bg-[#ffffff]">
          <div className="h-[108px] bg-[#eaf4ee]" />
          <div className="grid grid-cols-4 divide-x divide-[#eceae3] border-t border-[#eceae3]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 px-2 py-3">
                <div className="h-7 w-7 rounded-full bg-[#d8e8d4]" />
                <div className="h-2 w-10 rounded bg-[#e4ede0]" />
                <div className="h-3 w-8 rounded bg-[#e4ede0]" />
              </div>
            ))}
          </div>
        </div>
        <div className="overflow-hidden rounded-[14px] border border-[#e8e6e0] bg-[#ffffff]">
          <div className="flex border-b border-[#eceae3]">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1 py-3">
                <div className="h-4 w-4 rounded-full bg-[#d8e8d4]" />
                <div className="h-2.5 w-12 rounded bg-[#e4ede0]" />
              </div>
            ))}
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-[#eceae3] px-4 py-3 last:border-b-0">
              <div className="h-9 w-9 shrink-0 rounded-full bg-[#d8e8d4]" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 rounded bg-[#e4ede0]" />
                <div className="h-2.5 w-40 rounded bg-[#e4ede0]" />
              </div>
            </div>
          ))}
        </div>
        <div className="overflow-hidden rounded-[14px] border border-[#e8e6e0] bg-white">
          <div className="flex items-center px-1 py-3.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex min-w-0 flex-1 items-center">
                {i > 0 && <div className="mx-0.5 h-10 w-px shrink-0 bg-[#e0ded8]" />}
                <div className="flex flex-1 flex-col items-center gap-2 px-1 py-1">
                  <div className="h-5 w-5 rounded bg-[#d8e8d4]" />
                  <div className="h-2 w-10 rounded bg-[#e4ede0]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
