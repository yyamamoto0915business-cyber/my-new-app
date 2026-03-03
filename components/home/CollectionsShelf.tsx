"use client";

import type { Event } from "@/lib/db/types";
import { ShelfCard } from "./ShelfCard";
import { SectionHeader } from "./SectionHeader";

type Props = {
  /** 表示するイベント（親で重複排除・テーマ統合済み） */
  events: Event[];
  loading: boolean;
  bookmarkIds: string[];
  onBookmarkToggle: (eventId: string) => void;
};

/** テーマ別コレクション：1段入口＋すべて見る */
export function CollectionsShelf({
  events,
  loading = false,
  bookmarkIds,
  onBookmarkToggle,
}: Props) {
  /** ホームでは1段だけ表示（4件） */
  const display = events.slice(0, 4);

  if (loading) {
    return (
      <section className="space-y-4" aria-label="テーマ別コレクション">
        <SectionHeader
          title="テーマ別コレクション"
          subtitle="無料・親子・体験・文化体験から"
        />
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide sm:mx-0 sm:px-0">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-[140px] w-[168px] shrink-0 snap-start animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-700 sm:w-[200px]"
            />
          ))}
        </div>
      </section>
    );
  }

  if (display.length === 0) return null;

  return (
    <section className="space-y-4" aria-label="テーマ別コレクション">
      <SectionHeader
        title="テーマ別コレクション"
        subtitle="無料・親子・体験・文化体験から"
        href="/collections"
      />
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide sm:mx-0 sm:px-0">
        {display.map((e) => (
          <ShelfCard
            key={e.id}
            event={e}
            isBookmarked={bookmarkIds.includes(e.id)}
            onBookmarkToggle={onBookmarkToggle}
          />
        ))}
      </div>
    </section>
  );
}
