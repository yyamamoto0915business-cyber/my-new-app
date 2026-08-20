"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  LayoutGrid,
  PartyPopper,
  Dumbbell,
  Palette,
  BookOpen,
  Users,
  Music,
  Heart,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type CategoryItem = {
  label: string;
  categoryKey: string;
  href: string;
  icon: LucideIcon;
  bg: string;
  iconColor: string;
};

const CATEGORIES: CategoryItem[] = [
  {
    label: "まつり・イベント",
    categoryKey: "",
    href: "/events?tags=indoor",
    icon: PartyPopper,
    bg: "#fef3e8",
    iconColor: "#d4843a",
  },
  {
    label: "スポーツ・健康",
    categoryKey: "sports",
    href: "/events?tags=rain_ok",
    icon: Dumbbell,
    bg: "#eef6f2",
    iconColor: "#48a878",
  },
  {
    label: "体験・WS",
    categoryKey: "workshop",
    href: "/events?tags=beginner",
    icon: Palette,
    bg: "#f3eef8",
    iconColor: "#8868b8",
  },
  {
    label: "学び・講座",
    categoryKey: "study",
    href: "/events?tags=student",
    icon: BookOpen,
    bg: "#eef4fb",
    iconColor: "#4a78b8",
  },
  {
    label: "交流会",
    categoryKey: "community",
    href: "/events?tags=indoor",
    icon: Users,
    bg: "#fef8e8",
    iconColor: "#b89838",
  },
  {
    label: "音楽・ライブ",
    categoryKey: "music",
    href: "/events",
    icon: Music,
    bg: "#fceef4",
    iconColor: "#b85888",
  },
  {
    label: "ボランティア募集",
    categoryKey: "volunteer",
    href: "/?kind=volunteer",
    icon: Heart,
    bg: "#eaf4ed",
    iconColor: "#2d7d52",
  },
];

type Props = {
  compact?: boolean;
  selectedCategory?: string;
  onSelectCategory?: (key: string) => void;
};

export function PcCategoryGrid({ compact = false, selectedCategory, onSelectCategory }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section aria-label="カテゴリから探す" className={compact ? "min-w-0" : "space-y-3"}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-[#4a9a68]" aria-hidden />
          <h2 className="text-[14px] font-semibold text-[#0e1610]">カテゴリから探す</h2>
        </div>
        <Link
          href="/events"
          className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[#2c7a88] hover:underline"
        >
          すべて見る
          <ChevronRight className="h-3 w-3" aria-hidden />
        </Link>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide"
        >
          {CATEGORIES.map(({ label, categoryKey, href, icon: Icon, bg, iconColor }) => {
            const isActive = onSelectCategory !== undefined && selectedCategory === categoryKey && categoryKey !== "";
            const itemClass = `group flex shrink-0 flex-col items-center gap-1.5 rounded-[12px] ring-1 transition ${
              compact ? "w-[88px] p-2" : "w-[108px] p-3.5"
            } ${
              isActive
                ? "bg-[#eef6f2] ring-[#4a9a68]"
                : "bg-[#fafaf8] ring-[#e3e8e4] hover:ring-[#c8dcd0]"
            }`;

            if (onSelectCategory) {
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => onSelectCategory(categoryKey)}
                  className={itemClass}
                >
                  <span
                    className={`flex items-center justify-center rounded-[10px] ${
                      compact ? "h-8 w-8" : "h-10 w-10"
                    }`}
                    style={{ backgroundColor: bg }}
                  >
                    <Icon
                      className={compact ? "h-4 w-4" : "h-[18px] w-[18px]"}
                      style={{ color: iconColor }}
                      aria-hidden
                    />
                  </span>
                  <span className="text-center text-[9px] font-medium leading-tight text-[#3d5c48] group-hover:text-[#1a2b3c]">
                    {label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={label}
                href={href}
                className={itemClass}
              >
                <span
                  className={`flex items-center justify-center rounded-[10px] ${
                    compact ? "h-8 w-8" : "h-10 w-10"
                  }`}
                  style={{ backgroundColor: bg }}
                >
                  <Icon
                    className={compact ? "h-4 w-4" : "h-[18px] w-[18px]"}
                    style={{ color: iconColor }}
                    aria-hidden
                  />
                </span>
                <span className="text-center text-[9px] font-medium leading-tight text-[#3d5c48] group-hover:text-[#1a2b3c]">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
        {!compact && (
          <button
            type="button"
            onClick={() => scrollRef.current?.scrollBy({ left: 200, behavior: "smooth" })}
            className="absolute -right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-[#e3e8e4]"
            aria-label="カテゴリを右にスクロール"
          >
            <ChevronRight className="h-4 w-4 text-[#3d5c48]" />
          </button>
        )}
      </div>
    </section>
  );
}
