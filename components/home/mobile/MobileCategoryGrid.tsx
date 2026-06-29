"use client";

import Link from "next/link";
import {
  PartyPopper,
  Dumbbell,
  Palette,
  BookOpen,
  Users,
  Music,
  Heart,
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
    categoryKey: "community",
    href: "/events",
    icon: PartyPopper,
    bg: "#fef3e8",
    iconColor: "#d4843a",
  },
  {
    label: "スポーツ・健康",
    categoryKey: "sports",
    href: "/events",
    icon: Dumbbell,
    bg: "#eef6f2",
    iconColor: "#48a878",
  },
  {
    label: "体験・ワークショップ",
    categoryKey: "workshop",
    href: "/events",
    icon: Palette,
    bg: "#f3eef8",
    iconColor: "#8868b8",
  },
  {
    label: "学び・講座",
    categoryKey: "study",
    href: "/events",
    icon: BookOpen,
    bg: "#eef4fb",
    iconColor: "#4a78b8",
  },
  {
    label: "交流会・コミュニティ",
    categoryKey: "community",
    href: "/events",
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
    href: "/volunteer",
    icon: Heart,
    bg: "#eaf4ed",
    iconColor: "#2d7d52",
  },
];

type Props = {
  selectedCategory?: string;
  onSelectCategory?: (key: string) => void;
};

/** モック準拠：カテゴリは横スクロールの正方形カード */
export function MobileCategoryGrid({ selectedCategory, onSelectCategory }: Props) {
  return (
    <section aria-label="カテゴリから探す" className="space-y-2">
      <h2 className="text-[13px] font-semibold text-[#0e1610]">カテゴリから探す</h2>
      <div className="-mx-2.5 flex gap-2.5 overflow-x-auto px-2.5 pb-0.5 scrollbar-hide">
        {CATEGORIES.map(({ label, categoryKey, href, icon: Icon, bg, iconColor }) => {
          const isActive =
            onSelectCategory !== undefined &&
            selectedCategory === categoryKey &&
            categoryKey !== "";

          if (onSelectCategory && categoryKey !== "volunteer") {
            return (
              <button
                key={label}
                type="button"
                onClick={() => onSelectCategory(categoryKey)}
                className={`flex w-[92px] shrink-0 flex-col items-center gap-1.5 rounded-[14px] p-2.5 ring-1 transition active:bg-[#fafaf8] ${
                  isActive ? "bg-[#eef6f2] ring-[#4a9a68]" : "bg-white ring-[#e8ebe6]"
                }`}
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-[10px]"
                  style={{ backgroundColor: bg }}
                >
                  <Icon className="h-[18px] w-[18px]" style={{ color: iconColor }} aria-hidden />
                </span>
                <span className="text-center text-[9px] font-medium leading-tight text-[#3d5c48]">
                  {label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={label}
              href={href}
              className={`flex w-[92px] shrink-0 flex-col items-center gap-1.5 rounded-[14px] bg-white p-2.5 ring-1 ring-[#e8ebe6] active:bg-[#fafaf8] ${
                isActive ? "bg-[#eef6f2] ring-[#4a9a68]" : ""
              }`}
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-[10px]"
                style={{ backgroundColor: bg }}
              >
                <Icon className="h-[18px] w-[18px]" style={{ color: iconColor }} aria-hidden />
              </span>
              <span className="text-center text-[9px] font-medium leading-tight text-[#3d5c48]">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
