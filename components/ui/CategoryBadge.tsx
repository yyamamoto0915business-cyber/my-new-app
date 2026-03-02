"use client";

import type { CategoryKey } from "@/lib/inferCategory";
import { getPrimaryCategory } from "@/lib/inferCategory";
import type { Event } from "@/lib/db/types";

type Props = {
  event: Event;
  className?: string;
};

/** 画像上のカテゴリバッジ（可読性のため背景付き） */
export function CategoryBadge({ event, className = "" }: Props) {
  const cat = getPrimaryCategory(event);
  if (!cat) return null;

  return (
    <span
      className={`inline-block rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm ${className}`}
    >
      {cat}
    </span>
  );
}
