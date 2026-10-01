"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import type { MachiFeedItem } from "@/lib/machi/feed";
import { PcTownBrowseCard, PcTownBrowseCardSkeleton } from "@/components/home/pc/PcTownBrowseCard";

type Props = {
  picks: MachiFeedItem[];
  upcoming: MachiFeedItem[];
  results: MachiFeedItem[] | null;
  resultsTitle: string;
  panel: "both" | "picks" | "upcoming";
  loading: boolean;
  picksHref: string;
  upcomingHref: string;
  backHref: string;
};

function Leaf() {
  return (
    <svg className="h-4 w-4 text-[#7dbe78]" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M3 12c3.2-1 6-4.2 7.2-9.2.4 4.4 2.2 7.2 5.8 8.6-3.2.6-6 2.2-8.6 5.4-.6-2-1.6-3.4-4.4-4.8Z" />
    </svg>
  );
}

function SeeAll({ href }: { href: string }) {
  return (
    <Link href={href} scroll={false} className="text-[12.5px] font-medium text-[#2f7d4e] hover:underline">
      すべて見る →
    </Link>
  );
}

function CardGrid({ items }: { items: MachiFeedItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 min-[1100px]:grid-cols-4">
      {items.map((item) => (
        <PcTownBrowseCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function EmptyCopy({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-[16px] border border-[#e6eee6] bg-white px-6 py-10 text-center text-[13px] text-[#5d6e62]">
      {children}
    </p>
  );
}

export function PcTownBrowseFeed({
  picks,
  upcoming,
  results,
  resultsTitle,
  panel,
  loading,
  picksHref,
  upcomingHref,
  backHref,
}: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 min-[1100px]:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <PcTownBrowseCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (results) {
    return (
      <section aria-label={resultsTitle} className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-[18px] font-semibold text-[#1e3d2c]">{resultsTitle}</h2>
          <span className="text-[12px] text-[#6d7c70]">{results.length}件</span>
        </div>
        {results.length === 0 ? (
          <EmptyCopy>条件に合う情報は、まだありません。</EmptyCopy>
        ) : (
          <CardGrid items={results} />
        )}
      </section>
    );
  }

  const showPicks = panel === "both" || panel === "picks";
  const showUpcoming = panel === "both" || panel === "upcoming";

  return (
    <div className="space-y-4">
      {panel !== "both" ? (
        <Link href={backHref} scroll={false} className="inline-flex text-[12px] text-[#6d7c70] hover:text-[#1e3d2c]">
          ← まちの一覧にもどる
        </Link>
      ) : null}

      {showPicks ? (
        <section aria-label="今、見つけたいまちのおすすめ" className="space-y-2">
          <div className="flex items-end justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <Leaf />
              <h2
                className="text-[20px] font-medium text-[#245c38]"
                style={{
                  fontFamily: "var(--font-serif-display), 'Shippori Mincho', 'Noto Serif JP', serif",
                }}
              >
                今、見つけたい
                <span className="relative mx-1 inline-block">
                  まちのおすすめ
                  <span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-[#f0a05a]/80" />
                </span>
              </h2>
              <Leaf />
            </div>
            {panel === "both" ? <SeeAll href={picksHref} /> : null}
          </div>
          {picks.length === 0 ? (
            <EmptyCopy>おすすめの情報は、まだありません。</EmptyCopy>
          ) : (
            <CardGrid items={picks} />
          )}
        </section>
      ) : null}

      {showUpcoming ? (
        <section aria-label="開催前のイベント" className="space-y-2">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="flex items-center gap-1.5 text-[18px] font-semibold text-[#1e3d2c]">
                <MapPin className="h-4 w-4 text-[#2f7d4e]" aria-hidden />
                開催前のイベント
              </h2>
              <p className="mt-0.5 text-[12px] text-[#6d7c70]">
                これから開催されるイベント・お店・スポットをまとめてチェック
              </p>
            </div>
            {panel === "both" ? <SeeAll href={upcomingHref} /> : null}
          </div>
          {upcoming.length === 0 ? (
            <EmptyCopy>開催前の情報は、まだありません。</EmptyCopy>
          ) : (
            <CardGrid items={upcoming} />
          )}
        </section>
      ) : null}
    </div>
  );
}
