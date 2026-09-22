import { Suspense } from "react";
import { HomeOtonami } from "@/components/home-otonami";

export const dynamic = "force-dynamic";

function HomeFallback() {
  return (
    <div className="min-h-screen min-[900px]:bg-[#f3f4f1]">
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
      <div className="space-y-3 px-3 pt-1 min-[900px]:hidden">
        <div className="h-[160px] animate-pulse rounded-[16px] bg-[#e8ede4]" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 flex-1 animate-pulse rounded-full bg-[#e8ede4]" />
          ))}
        </div>
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-[200px] w-[148px] shrink-0 animate-pulse rounded-[16px] bg-[#e8ede4]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <main className="relative z-10 flex-1">
        <Suspense fallback={<HomeFallback />}>
          <HomeOtonami />
        </Suspense>
      </main>
    </div>
  );
}
