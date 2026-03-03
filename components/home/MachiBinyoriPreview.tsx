"use client";

import type { Event } from "@/lib/db/types";
import { ShelfCard } from "./ShelfCard";
import { SectionHeader } from "./SectionHeader";

type Props = {
  /** 表示するイベント（親で重複排除済み） */
  events: Event[];
  loading: boolean;
  bookmarkIds: string[];
  onBookmarkToggle: (id: string) => void;
};

/** 今週のまち便り：プレビュー */
export function MachiBinyoriPreview({
  events,
  loading,
  bookmarkIds,
  onBookmarkToggle,
}: Props) {
  const available = events.slice(0, 2);

  if (loading) {
    return (
      <section className="space-y-4" aria-label="今週のまち便り">
        <SectionHeader title="今週のまち便り" />
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide sm:mx-0 sm:px-0">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[140px] w-[168px] shrink-0 snap-start animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-700 sm:w-[200px]"
            />
          ))}
        </div>
      </section>
    );
  }

  if (available.length === 0) return null;

  return (
    <section className="space-y-4" aria-label="今週のまち便り">
      <SectionHeader title="今週のまち便り" href="/events" />
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide sm:mx-0 sm:px-0">
        {available.map((e) => (
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
