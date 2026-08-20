"use client";

import Image from "next/image";
import {
  CalendarDays,
  FileEdit,
  Heart,
  Store,
  Tent,
  Truck,
  type LucideIcon,
} from "lucide-react";
import type { PostCategory } from "@/lib/posts/mock-feed";
import type { MyPostsStats } from "@/lib/posts/my-posts-stats";
import {
  ARCHIVE_MONTH_ORDER,
  monthKeyForYear,
} from "@/lib/posts/group-my-posts-by-season";

const CLIP = "/profile/album/sprig-cut.png";

const CATEGORY_ICON: Record<PostCategory, LucideIcon> = {
  event: Tent,
  shop: Store,
  spot: Heart,
  kitchen: Truck,
  scenery: CalendarDays,
};

type Props = {
  year: number;
  stats: MyPostsStats;
  monthCounts: Record<number, number>;
  draftCount: number;
  onMonthClick: (monthKey: string) => void;
  onDraftClick: () => void;
};

export function MyPostsSidebar({
  year,
  stats,
  monthCounts,
  draftCount,
  onMonthClick,
  onDraftClick,
}: Props) {
  return (
    <aside className="my-album-sidebar">
      <section className="my-album-panel my-album-panel--record">
        <Image
          src={CLIP}
          alt=""
          width={54}
          height={54}
          className="my-album-panel__flower"
          aria-hidden
        />

        {/* 記録 */}
        <div className="my-album-block">
          <h2 className="my-album-panel__title">{year}年の記録</h2>
          <p className="my-album-total2">
            <span className="my-album-total2__num">{stats.publishedTotal}</span>
            <span className="my-album-total2__unit">件の思い出</span>
          </p>
          <ul className="my-album-chips">
            {stats.byCategory.map((c) => {
              const Icon = CATEGORY_ICON[c.category] ?? CalendarDays;
              return (
                <li key={c.category} className="my-album-chip">
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  <span className="my-album-chip__label">{c.label}</span>
                  <span className="my-album-chip__count">{c.count}</span>
                </li>
              );
            })}
          </ul>
          {draftCount > 0 && (
            <button
              type="button"
              className="my-album-record__draft"
              onClick={onDraftClick}
            >
              <FileEdit className="h-3.5 w-3.5" aria-hidden />
              下書き（{draftCount}）
            </button>
          )}
        </div>

        <div className="my-album-panel__divider" aria-hidden />

        {/* 月別アーカイブ */}
        <div className="my-album-block">
          <h2 className="my-album-panel__title">月別アーカイブ</h2>
          <div className="my-album-months">
            {ARCHIVE_MONTH_ORDER.map((m) => {
              const count = monthCounts[m] ?? 0;
              return (
                <button
                  key={m}
                  type="button"
                  className={`my-album-months__cell${count > 0 ? " has-posts" : ""}`}
                  onClick={() => onMonthClick(monthKeyForYear(year, m))}
                  disabled={count === 0}
                >
                  <span className="my-album-months__name">{m}月</span>
                  {count > 0 && (
                    <span className="my-album-months__count">{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </aside>
  );
}
