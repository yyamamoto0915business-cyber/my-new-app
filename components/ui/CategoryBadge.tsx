"use client";

import type { CategoryKey } from "@/lib/categories";
import { CATEGORY_LABELS } from "@/lib/categories";
import { getPrimaryCategory } from "@/lib/inferCategory";
import type { Event } from "@/lib/db/types";

type Props = {
  event: Event;
  className?: string;
};

/** 画像上のカテゴリバッジ（可読性のため背景付き。表示はラベル） */
export function CategoryBadge({ event, className = "" }: Props) {
  const key = getPrimaryCategory(event);
  if (!key) return null;

  const label = CATEGORY_LABELS[key] ?? key;

  return (
    <span
      className={`inline-block rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm ${className}`}
    >
      {label}
    </span>
  );
}
