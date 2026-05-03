"use client";

import { WaHeroBanner } from "@/components/wa-hero-banner";

type VolunteerHeroProps = {
  totalCount?: number;
  thisWeekCount?: number;
  beginnerFriendlyCount?: number;
  travelSupportCount?: number;
  isLoading?: boolean;
};

function formatCount(count: number | undefined): string {
  return typeof count === "number" ? String(count) : "--";
}

function StatChip({
  label,
  value,
  isLoading,
}: {
  label: string;
  value?: number;
  isLoading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#b8d0c8] bg-[#eef6f2] px-3 py-2.5">
      <p className="text-[10px] text-[#6a6258]">{label}</p>
      {isLoading ? (
        <div className="mt-1 h-6 w-10 animate-pulse rounded bg-[#c0dcd6]" />
      ) : (
        <p
          className="mt-0.5 font-serif text-[18px] font-bold text-[#1e3020]"
          style={{ fontFamily: "'Shippori Mincho', 'Noto Serif JP', serif" }}
        >
          {formatCount(value)}
        </p>
      )}
    </div>
  );
}

export function VolunteerHero({
  totalCount,
  thisWeekCount,
  beginnerFriendlyCount,
  travelSupportCount,
  isLoading = false,
}: VolunteerHeroProps) {
  return (
    <section className="mb-5" aria-label="ボランティア募集">
      {/* 和テイストヒーローバナー */}
      <WaHeroBanner
        eyebrow="VOLUNTEER"
        title="募集中の活動一覧"
        subtitle="参加やお手伝いを募集している活動です"
        compact
        className="rounded-sm"
      />

      {/* 統計グリッド */}
      <div className="mt-3 grid grid-cols-4 gap-2">
        <StatChip label="募集中" value={totalCount} isLoading={isLoading} />
        <StatChip label="今週開催" value={thisWeekCount} isLoading={isLoading} />
        <StatChip label="初心者歓迎" value={beginnerFriendlyCount} isLoading={isLoading} />
        <StatChip label="交通費あり" value={travelSupportCount} isLoading={isLoading} />
      </div>
    </section>
  );
}
