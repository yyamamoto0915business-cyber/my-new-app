"use client";

import { useRef, useState, useEffect } from "react";
import {
  MobileVolunteerCard,
  MobileVolunteerCardSkeleton,
  type MobileVolunteerCardItem,
} from "./MobileVolunteerCard";

const VISIBLE_COUNT = 3;
const GAP_PX = 8;

type Props = {
  items: MobileVolunteerCardItem[];
  loading: boolean;
  totalCount: number;
  onResetFilters?: () => void;
};

export function MobileVolunteerRecommendedCarousel({
  items,
  loading,
  totalCount,
  onResetFilters,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activePage, setActivePage] = useState(0);

  const displayItems = items.slice(0, 9);
  const pageCount = Math.max(1, Math.ceil(displayItems.length / VISIBLE_COUNT));
  const dotCount = Math.min(5, pageCount);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const card = el.querySelector<HTMLElement>("article");
      if (!card) return;
      const step = card.offsetWidth + GAP_PX;
      const pageIndex = Math.round(el.scrollLeft / (step * VISIBLE_COUNT));
      setActivePage(Math.min(dotCount - 1, Math.max(0, pageIndex)));
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [dotCount, displayItems.length]);

  return (
    <section aria-label="おすすめのボランティア" className="space-y-1.5">
      <div className="flex items-center justify-between px-3">
        <h2 className="text-[13px] font-semibold text-[#1A2214]">
          おすすめのボランティア
          {!loading && totalCount > 0 && (
            <span className="ml-1.5 text-[11px] font-normal text-[#8a9e98]">{totalCount}件</span>
          )}
        </h2>
        <button type="button" className="text-[11px] font-medium text-[#2D7A4F]">
          すべて見る &gt;
        </button>
      </div>

      {!loading && totalCount === 0 ? (
        <div className="mx-3 rounded-[12px] border border-[#DDE8DF] bg-white p-6 text-center">
          <p className="text-[12px] text-[#566358]">条件に合う募集がありません</p>
          {onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="mt-2 text-[11px] font-medium text-[#2D7A4F] underline"
            >
              条件をリセット
            </button>
          )}
        </div>
      ) : (
        <>
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto px-3 pb-0.5 scrollbar-hide snap-x snap-mandatory"
      >
        {loading
          ? Array.from({ length: VISIBLE_COUNT }).map((_, i) => (
              <MobileVolunteerCardSkeleton key={i} />
            ))
          : displayItems.length > 0
          ? displayItems.map((item) => <MobileVolunteerCard key={item.id} item={item} />)
          : Array.from({ length: VISIBLE_COUNT }).map((_, i) => (
              <MobileVolunteerCardSkeleton key={i} />
            ))}
      </div>

      {!loading && displayItems.length > VISIBLE_COUNT && (
        <div className="flex justify-center gap-1.5" aria-hidden>
          {Array.from({ length: dotCount }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === activePage ? "w-3.5 bg-[#2D7A4F]" : "w-1.5 bg-[#DDE8DF]"
              }`}
            />
          ))}
        </div>
      )}
        </>
      )}
    </section>
  );
}
