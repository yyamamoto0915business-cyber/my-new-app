"use client";

import { useMemo } from "react";
import {
  BookOpen,
  CalendarClock,
  Dumbbell,
  HandHeart,
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
import { MobileSectionHeading } from "@/components/home/mobile/MobileSectionHeading";

const THEME_COUNT = 3;

type ThemeLook = { label: string; Icon: LucideIcon; color: string; bg: string };

/**
 * カテゴリごとの見出し・アイコン・色。
 * 写真はイベントの画像に文字が入っていると読めなくなるので使わず、色のタイルにする。
 */
const CATEGORY_THEMES: Record<CategoryKey, ThemeLook> = {
  community: { label: "まつり・\n交流", Icon: PartyPopper, color: "#c2552f", bg: "#fdece4" },
  workshop: { label: "体験して\nみる", Icon: Palette, color: "#7a5cc0", bg: "#f1ecfa" },
  food: { label: "旬の味覚を\n楽しむ", Icon: UtensilsCrossed, color: "#b07a1c", bg: "#fdf3dc" },
  family: { label: "親子で\nおでかけ", Icon: Users, color: "#d0567a", bg: "#fde9ef" },
  sports: { label: "からだを\n動かす", Icon: Dumbbell, color: "#2f6fae", bg: "#e6f1fa" },
  music: { label: "音楽に\nふれる", Icon: Music, color: "#8a4fb0", bg: "#f4eafa" },
  study: { label: "学びの\n時間", Icon: BookOpen, color: "#2f7d4e", bg: "#e6f3ea" },
  volunteer: { label: "まちを\n手伝う", Icon: HandHeart, color: "#c0466a", bg: "#fcebf0" },
};

/** カテゴリが3つに満たないときに足す、日付のテーマ */
const DATE_THEMES = {
  weekend: { label: "週末の\nおでかけ", Icon: MapPin, color: "#2f7ab0", bg: "#e8f2fa" },
  today: { label: "今日の\nイベント", Icon: CalendarClock, color: "#3d8a5a", bg: "#e9f5ec" },
} as const satisfies Record<string, ThemeLook>;

export type ThemeSelection =
  | { type: "category"; key: CategoryKey }
  | { type: "date"; range: keyof typeof DATE_THEMES };

type Theme = ThemeLook & {
  id: string;
  selection: ThemeSelection;
  count: number;
};

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

    const counts = new Map<CategoryKey, number>();
    for (const e of upcoming) {
      const key = getPrimaryCategory(e);
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const categoryThemes: Theme[] = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => ({
        id: `category-${key}`,
        selection: { type: "category", key },
        ...CATEGORY_THEMES[key],
        count,
      }));

    const dateThemes: Theme[] = (["weekend", "today"] as const)
      .map((range) => ({
        id: `date-${range}`,
        selection: { type: "date", range } as ThemeSelection,
        ...DATE_THEMES[range],
        count: getEventsByDateRange(upcoming, range).length,
      }))
      .filter((t) => t.count > 0);

    return [...categoryThemes, ...dateThemes].slice(0, THEME_COUNT);
  }, [events]);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: THEME_COUNT }).map((_, i) => (
          <div key={i} className="h-[96px] animate-pulse rounded-[16px] bg-[#e5ede6]" />
        ))}
      </div>
    );
  }
  if (themes.length === 0) return null;

  return (
    <section aria-label="テーマから見つける">
      <MobileSectionHeading eyebrow="THEME" title="テーマから見つける" href="/events" />
      <div className="grid grid-cols-3 gap-2">
        {themes.map(({ id, selection, label, Icon, color, bg, count }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(selection)}
            className="flex min-h-[96px] flex-col justify-between rounded-[16px] border border-white/60 p-2.5 text-left shadow-[0_3px_10px_rgba(22,56,40,0.06)] active:scale-[0.98]"
            style={{ background: bg }}
          >
            <span className="flex items-center justify-between">
              <Icon className="h-6 w-6" style={{ color }} aria-hidden />
              <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-bold" style={{ color }}>
                {count}件
              </span>
            </span>
            <span className="whitespace-pre-line text-[12.5px] font-bold leading-[1.3] text-[#163828]">
              {label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
