/**
 * 画面を読み込んでいるあいだの仮の画面。押した瞬間に次の画面の形を出して、反応がない時間をなくす。
 * スマホ・タブレットは見出しとカードの形、PC はホームに近い形。
 */
export default function HomeLoading() {
  return (
    <>
      <div
        className="mx-auto w-full max-w-[680px] space-y-3 px-4 pt-4 pb-24 motion-safe:animate-pulse min-[900px]:hidden"
        aria-busy
        aria-label="読み込み中"
      >
        <div className="h-3 w-20 rounded-full bg-[#eadfc4]" />
        <div className="h-7 w-44 rounded-lg bg-[#e6ece6]" />
        <div className="h-40 rounded-[18px] bg-[#e8ede8]" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-28 rounded-[16px] border border-[#e8ede8] bg-white" />
          <div className="h-28 rounded-[16px] border border-[#e8ede8] bg-white" />
        </div>
        <div className="h-20 rounded-[16px] border border-[#e8ede8] bg-white" />
        <div className="h-20 rounded-[16px] border border-[#e8ede8] bg-white" />
      </div>
      <PcHomeLoading />
    </>
  );
}

function PcHomeLoading() {
  return (
    <div className="mx-auto hidden max-w-[1280px] animate-pulse space-y-4 px-8 py-4 min-[900px]:block">
      {/* Hero skeleton */}
      <div className="h-[248px] rounded-[16px] bg-[#e8ede8]" />
      {/* Filters skeleton */}
      <div className="h-[96px] rounded-[16px] bg-[#e8ede8]" />
      {/* Cards skeleton */}
      <div className="grid grid-cols-5 gap-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[220px] rounded-[12px] bg-[#e8ede8]" />
        ))}
      </div>
    </div>
  );
}
