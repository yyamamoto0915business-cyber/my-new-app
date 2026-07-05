"use client";

import { useRef, useState, useEffect } from "react";
import { ThumbsUp } from "lucide-react";
import {
  MobileVolunteerCard,
  MobileVolunteerCardSkeleton,
  type MobileVolunteerCardItem,
} from "./MobileVolunteerCard";

const VISIBLE_COUNT = 3;
const GAP_PX = 8;
const SKELETON_COUNT = 3;

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
    <section aria-label="おすすめのボランティア" className="mg-mobile-section">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ThumbsUp className="h-3.5 w-3.5 fill-[#2f6b4f] text-[#2f6b4f]" aria-hidden />
          <h2 className="mg-mobile-section-title">
            おすすめのボランティア
            {!loading && totalCount > 0 && (
              <span className="ml-1.5 text-[11px] font-normal text-[#8a9088]">
                {totalCount}件
              </span>
            )}
          </h2>
        </div>
        <button type="button" className="shrink-0 text-[11px] font-medium text-[#2f6b4f]">
          すべて見る →
        </button>
      </div>

      {!loading && totalCount === 0 ? (
        <div className="rounded-[18px] border border-[#dde9e1] bg-[#f7fbf8] p-4 text-center">
          <p className="text-[11px] text-[#6a6258]">条件に合う募集がありません</p>
          {onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="mt-2 text-[11px] font-medium text-[#2f6b4f] underline"
            >
              条件をリセット
            </button>
          )}
        </div>
      ) : (
        <>
          <div
            ref={scrollRef}
            className="flex gap-2 overflow-x-auto pl-1 pr-1 pb-0.5 scrollbar-hide snap-x snap-mandatory"
          >
            {loading
              ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                  <MobileVolunteerCardSkeleton key={i} />
                ))
              : displayItems.length > 0
                ? displayItems.map((item) => (
                    <MobileVolunteerCard key={item.id} item={item} />
                  ))
                : Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                    <MobileVolunteerCardSkeleton key={i} />
                  ))}
          </div>

          {!loading && displayItems.length > VISIBLE_COUNT && (
            <div className="mt-1.5 flex justify-center gap-1.5" aria-hidden>
              {Array.from({ length: dotCount }).map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activePage ? "w-3.5 bg-[#2f6b4f]" : "w-1.5 bg-[#dde9e1]"
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
