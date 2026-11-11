import { Suspense } from "react";
import { HomeOtonami } from "@/components/home-otonami";

export const dynamic = "force-dynamic";

function HomeFallback() {
  return (
    <div className="min-h-screen-dvh min-[900px]:bg-[#f3f4f1]">
      <div className="mx-auto hidden max-w-[1280px] space-y-4 px-8 py-4 min-[900px]:block">
        <div className="aspect-[1415/256] min-h-[185px] animate-pulse rounded-[16px] bg-[#e8ede4]" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-[12px] bg-[#e8ede4]" />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[16/10] animate-pulse rounded-[12px] bg-[#e8ede4]" />
          ))}
        </div>
      </div>
      {/* スマホ：検索バー／種別カード／注目バナー */}
      <div className="space-y-5 px-3 pt-1 min-[900px]:hidden">
        <div className="h-12 animate-pulse rounded-full bg-[#e8ede4]" />
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[92px] w-[80px] shrink-0 animate-pulse rounded-[18px] bg-[#e8ede4]" />
          ))}
        </div>
        <div className="h-[210px] w-full animate-pulse rounded-[18px] bg-[#e8ede4]" />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="relative flex min-h-screen-dvh flex-col">
      <main className="relative z-10 flex-1">
        <Suspense fallback={<HomeFallback />}>
          <HomeOtonami />
        </Suspense>
      </main>
    </div>
  );
}
