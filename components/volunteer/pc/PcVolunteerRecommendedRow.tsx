"use client";

import Link from "next/link";
import { PcVolunteerCard } from "./PcVolunteerCard";

export type PcVolunteerCardItem = {
  id: string;
  title: string;
  imageUrl?: string | null;
  dateLabel: string;
  areaLabel: string;
  tags: string[];
  href: string;
};

type Props = {
  items: PcVolunteerCardItem[];
  loading: boolean;
  totalCount: number;
  emptyMessage?: string;
  emptyHint?: string;
};

function CardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[12px] border border-[#DDE8DF] bg-white">
      <div className="aspect-[16/10] w-full animate-pulse bg-[#EAF4ED]" />
      <div className="space-y-2 px-3 pb-3 pt-2.5">
        <div className="h-3 w-2/3 animate-pulse rounded bg-[#EAF4ED]" />
        <div className="h-8 w-full animate-pulse rounded bg-[#EAF4ED]" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-[#EAF4ED]" />
      </div>
    </div>
  );
}

export function PcVolunteerRecommendedRow({
  items,
  loading,
  totalCount,
  emptyMessage = "条件に合う募集がありません",
  emptyHint = "条件を変えて再度お試しください",
}: Props) {
  const displayItems = items.slice(0, 4);

  return (
    <section aria-label="おすすめボランティア" className="min-w-0 flex-1">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-semibold leading-none text-[#1A2214]">
          おすすめのボランティア
          {!loading && totalCount > 0 && (
            <span className="ml-2 text-[12px] font-normal text-[#8a9e98]">
              {totalCount}件
            </span>
          )}
        </h2>
        {totalCount > 4 && (
          <Link
            href="#volunteer-results"
            className="shrink-0 text-[12px] font-medium text-[#2D7A4F] hover:underline"
          >
            すべて見る &gt;
          </Link>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-4 items-stretch gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : displayItems.length === 0 ? (
        <div className="rounded-[12px] border border-[#DDE8DF] bg-white p-10 text-center">
          <p className="text-[13px] text-[#566358]">{emptyMessage}</p>
          {emptyHint ? (
            <p className="mt-1 text-[11px] text-[#566358]/60">{emptyHint}</p>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-4 items-stretch gap-3">
          {displayItems.map((item) => (
            <PcVolunteerCard key={item.id} {...item} />
          ))}
        </div>
      )}
    </section>
  );
}
