"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  Dumbbell,
  HandHeart,
  Leaf,
  MapPin,
  Music,
  Palette,
  PartyPopper,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import type { Event } from "@/lib/db/types";
import type { CategoryKey } from "@/lib/categories";
import { getEventStatus, getEventsByDateRange } from "@/lib/events";
import { getPrimaryCategory } from "@/lib/inferCategory";
import { EventThumbnail } from "@/components/event-thumbnail";

const THEME_COUNT = 3;

/** カテゴリごとの見出しとアイコン（カードは写真の上に白文字で出す） */
const CATEGORY_THEMES: Record<CategoryKey, { label: string; Icon: LucideIcon }> = {
  community: { label: "まつり・\n交流を楽しむ", Icon: PartyPopper },
  workshop: { label: "体験して\nみる", Icon: Palette },
  food: { label: "旬の味覚を\n楽しむ", Icon: UtensilsCrossed },
  family: { label: "親子で\nおでかけ", Icon: Users },
  sports: { label: "からだを\n動かす", Icon: Dumbbell },
  music: { label: "音楽に\nふれる", Icon: Music },
  study: { label: "学びの\n時間", Icon: BookOpen },
  volunteer: { label: "まちを\n手伝う", Icon: HandHeart },
};

/** カテゴリが3つに満たないときに足す、日付のテーマ */
const DATE_THEMES = {
  weekend: { label: "週末の\nおでかけ", Icon: MapPin },
  today: { label: "今日の\nイベント", Icon: CalendarClock },
} as const;

export type ThemeSelection =
  | { type: "category"; key: CategoryKey }
  | { type: "date"; range: keyof typeof DATE_THEMES };

type Theme = {
  id: string;
  selection: ThemeSelection;
  label: string;
  Icon: LucideIcon;
  count: number;
  imageUrl: string | null;
};

function firstImage(events: Event[]): string | null {
  return events.find((e) => e.imageUrl)?.imageUrl ?? null;
}

type Props = {
  events: Event[];
  loading: boolean;
  onSelect: (selection: ThemeSelection) => void;
};

/**
 * まちの情報（スマホ）：テーマから見つける（見本の「季節の発見」の位置）。
 * 特集のデータはまだないので、これからのイベントで件数の多いカテゴリを出し、
 * 3つに満たなければ「週末」「今日」で埋める。押すとその条件で絞り込む。
 */
export function MobileThemeDiscovery({ events, loading, onSelect }: Props) {
  const themes = useMemo((): Theme[] => {
    const upcoming = events.filter((e) => getEventStatus(e) !== "ended");

    const byCategory = new Map<CategoryKey, Event[]>();
    for (const e of upcoming) {
      const key = getPrimaryCategory(e);
      if (!key) continue;
      byCategory.set(key, [...(byCategory.get(key) ?? []), e]);
    }
    const categoryThemes: Theme[] = [...byCategory.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .map(([key, list]) => ({
        id: `category-${key}`,
        selection: { type: "category", key },
        ...CATEGORY_THEMES[key],
        count: list.length,
        imageUrl: firstImage(list),
      }));

    const dateThemes: Theme[] = (["weekend", "today"] as const)
      .map((range) => {
        const list = getEventsByDateRange(upcoming, range);
        return {
          id: `date-${range}`,
          selection: { type: "date", range } as ThemeSelection,
          ...DATE_THEMES[range],
          count: list.length,
          imageUrl: firstImage(list),
        };
      })
      .filter((t) => t.count > 0);

    return [...categoryThemes, ...dateThemes].slice(0, THEME_COUNT);
  }, [events]);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: THEME_COUNT }).map((_, i) => (
          <div key={i} className="aspect-[4/3] animate-pulse rounded-[16px] bg-[#e5ede6]" />
        ))}
      </div>
    );
  }
  if (themes.length === 0) return null;

  return (
    <section aria-label="テーマから見つける">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-[16px] font-bold text-[#163828]">
          <Leaf className="h-5 w-5 text-[#1f5e3a]" aria-hidden />
          テーマから見つける
        </h2>
        <Link
          href="/events"
          className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-[#1f5e3a]"
        >
          もっとみる
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {themes.map(({ id, selection, label, Icon, imageUrl }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(selection)}
            className="relative aspect-[4/3] overflow-hidden rounded-[16px] bg-gradient-to-br from-[#4f8a63] to-[#244d36] text-left shadow-[0_4px_12px_rgba(22,56,40,0.12)] active:scale-[0.98]"
          >
            {imageUrl && (
              <EventThumbnail imageUrl={imageUrl} alt="" rounded="none" fill placeholderSize="icon" />
            )}
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent"
              aria-hidden
            />
            <span className="absolute inset-x-2 bottom-2 flex items-end gap-1.5 text-white">
              <Icon className="mb-0.5 h-5 w-5 shrink-0" aria-hidden />
              <span className="whitespace-pre-line text-[11px] font-bold leading-[1.3]">{label}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
