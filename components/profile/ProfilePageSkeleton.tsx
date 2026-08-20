/** マイページの初期表示用スケルトン（ルート loading とクライアント取得中で共通） */
export function ProfilePageSkeleton() {
  return (
    <div className="mg-profile-mobile-page mg-mypage-mobile-white relative min-h-screen w-full min-[900px]:bg-[#F7F8F5]">
      {/* Mobile skeleton */}
      <div className="mx-auto w-full max-w-screen-sm space-y-2.5 px-4 py-3 pb-24 animate-pulse min-[900px]:hidden sm:pb-8">
        <div className="overflow-hidden rounded-[14px] border border-[#e8e6e0] bg-[#ffffff]">
          <div className="h-[108px] bg-[#eaf4ee]" />
          <div className="grid grid-cols-4 divide-x divide-[#eceae3] border-t border-[#eceae3]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 px-2 py-3">
                <div className="h-9 w-9 rounded-full bg-[#d8e8d4]" />
                <div className="h-2.5 w-12 rounded bg-[#e4ede0]" />
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[124px] rounded-[14px] bg-[#eaf4ee]" />
          ))}
        </div>
        <div className="h-[168px] rounded-[14px] bg-[#efe6d4]" />
        <div className="h-12 overflow-hidden rounded-[14px] border border-[#e8e6e0] bg-[#ffffff]" />
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

      {/* PC skeleton */}
      <div className="mx-auto hidden w-full max-w-[1280px] animate-pulse flex-col gap-3 px-8 py-4 min-[900px]:flex">
        <div className="h-[148px] overflow-hidden rounded-[14px] border border-[#E5E7E2] bg-[#EAF6EF]" />
        <div className="overflow-hidden rounded-[14px] border border-[#E5E7E2] bg-white">
          <div className="grid grid-cols-4 divide-x divide-[#E5E7E2]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-center gap-2.5 px-3 py-3.5">
                <div className="h-9 w-9 rounded-full bg-[#EAF6EF]" />
                <div className="space-y-1.5">
                  <div className="h-2 w-16 rounded bg-[#E4EDE0]" />
                  <div className="h-3.5 w-8 rounded bg-[#E4EDE0]" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-[14px] border border-[#E5E7E2] bg-white"
            >
              <div className="border-b border-[#E5E7E2] px-3.5 py-2.5">
                <div className="h-3.5 w-16 rounded bg-[#E4EDE0]" />
              </div>
              {Array.from({ length: 4 }).map((_, j) => (
                <div
                  key={j}
                  className="flex items-center gap-2.5 border-b border-[#E5E7E2] px-3.5 py-2.5 last:border-b-0"
                >
                  <div className="h-8 w-8 shrink-0 rounded-full bg-[#EAF6EF]" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 w-24 rounded bg-[#E4EDE0]" />
                    <div className="h-2 w-36 rounded bg-[#E4EDE0]" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
