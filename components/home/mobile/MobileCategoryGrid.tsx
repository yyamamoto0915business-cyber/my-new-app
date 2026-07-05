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
  Home,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type CategoryItem = {
  label: string;
  categoryKey: string;
  href: string;
  icon: LucideIcon;
  iconColor: string;
};

const CATEGORIES: CategoryItem[] = [
  {
    label: "まつり・イベント",
    categoryKey: "community",
    href: "/events",
    icon: PartyPopper,
    iconColor: "#d4843a",
  },
  {
    label: "スポーツ・健康",
    categoryKey: "sports",
    href: "/events",
    icon: Dumbbell,
    iconColor: "#2f7d4e",
  },
  {
    label: "体験・ワークショップ",
    categoryKey: "workshop",
    href: "/events",
    icon: Palette,
    iconColor: "#8868b8",
  },
  {
    label: "学び・講座",
    categoryKey: "study",
    href: "/events",
    icon: BookOpen,
    iconColor: "#4a78b8",
  },
  {
    label: "交流会・コミュニティ",
    categoryKey: "community",
    href: "/events",
    icon: Users,
    iconColor: "#b89838",
  },
  {
    label: "音楽・ライブ",
    categoryKey: "music",
    href: "/events",
    icon: Music,
    iconColor: "#b85888",
  },
  {
    label: "ボランティア募集",
    categoryKey: "volunteer",
    href: "/volunteer",
    icon: Heart,
    iconColor: "#2f6b4f",
  },
];

const ICON_BG = "#f3f8f5";

type Props = {
  selectedCategory?: string;
  onSelectCategory?: (key: string) => void;
  /** 親セクション内に埋め込む場合 */
  embedded?: boolean;
};

function CategoryCard({
  label,
  categoryKey,
  href,
  icon: Icon,
  iconColor,
  isActive,
  onSelect,
}: CategoryItem & {
  isActive: boolean;
  onSelect?: (key: string) => void;
}) {
  const cardClass = cn(
    "flex h-[82px] w-[76px] shrink-0 flex-col items-center justify-center gap-1 rounded-[18px] border p-2 transition active:bg-[#fafcf9]",
    isActive
      ? "border-[#b8dcc8] bg-[#eef6f2]"
      : "border-[#dde9e1] bg-white shadow-[0_4px_12px_rgba(22,56,40,0.04)]"
  );

  const inner = (
    <>
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px]"
        style={{ backgroundColor: ICON_BG }}
      >
        <Icon className="h-[18px] w-[18px]" style={{ color: iconColor }} strokeWidth={2} aria-hidden />
      </span>
      <span className="line-clamp-2 text-center text-[9px] font-medium leading-[1.15] text-[#163828]">
        {label}
      </span>
    </>
  );

  if (onSelect && categoryKey !== "volunteer") {
    return (
      <button type="button" onClick={() => onSelect(categoryKey)} className={cardClass}>
        {inner}
      </button>
    );
  }

  return (
    <Link href={href} className={cardClass}>
      {inner}
    </Link>
  );
}

export function MobileCategoryGrid({ selectedCategory, onSelectCategory, embedded }: Props) {
  const content = (
    <>
      <div className="mb-1.5 flex items-center gap-1.5">
        <Home className="h-3.5 w-3.5 text-[#2f7d4e]" aria-hidden />
        <h2 className="mg-mobile-section-title">カテゴリから探す</h2>
      </div>
      <div className={embedded ? "-mx-2.5 flex gap-2 overflow-x-auto px-2.5 pr-4 scrollbar-hide" : "-mx-3 flex gap-2 overflow-x-auto px-3 pr-5 scrollbar-hide"}>
        {CATEGORIES.map((item) => {
          const isActive =
            onSelectCategory !== undefined &&
            selectedCategory === item.categoryKey &&
            item.categoryKey !== "";

          return (
            <CategoryCard
              key={item.label}
              {...item}
              isActive={isActive}
              onSelect={onSelectCategory}
            />
          );
        })}
      </div>
    </>
  );

  if (embedded) return content;

  return (
    <section aria-label="カテゴリから探す" className="mg-mobile-section">
      {content}
    </section>
  );
}
