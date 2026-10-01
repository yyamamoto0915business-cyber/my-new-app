import { Suspense } from "react";
import type { Metadata } from "next";
import { PcTownBrowsePage } from "@/components/home/pc/PcTownBrowsePage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "まちの情報をすべて見る | MachiGlyph",
  description: "イベント・お店・体験・ボランティア・ゲームを、まとめて探せます。",
};

function BrowseFallback() {
  return (
    <div className="mx-auto hidden max-w-[1280px] gap-4 px-6 py-4 min-[900px]:flex">
      <div className="h-[640px] w-[212px] animate-pulse rounded-[18px] bg-[#e7f0e6]" />
      <div className="min-w-0 flex-1 space-y-4">
        <div className="h-[148px] animate-pulse rounded-[18px] bg-[#e7f0e6]" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="aspect-[16/10] animate-pulse rounded-[16px] bg-[#e7f0e6]" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MachiPage() {
  return (
    <Suspense fallback={<BrowseFallback />}>
      <PcTownBrowsePage />
    </Suspense>
  );
}
