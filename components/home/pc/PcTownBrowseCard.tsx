"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, CalendarDays, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MachiFeedItem } from "@/lib/machi/feed";

type Props = {
  item: MachiFeedItem;
};

const BADGE_COLOR: Record<string, string> = {
  イベント: "#3d6fbf",
  体験: "#2f7d4e",
  食: "#c45a8a",
  グルメ: "#c45a8a",
  交流: "#7a5ab8",
  交流会: "#7a5ab8",
  親子: "#e07a3d",
  ボランティア: "#2D7A4F",
  ゲーム: "#2d7a4f",
  キッチンカー: "#d4843a",
  店舗: "#b56a2e",
  特売: "#c45a1a",
  音楽: "#7a5ab8",
  スポーツ: "#3d8a9a",
  学び: "#3d6fbf",
  勉強: "#3d6fbf",
};

function badgeOf(item: MachiFeedItem): string {
  if (item.kind === "event" && item.tags[0]) return item.tags[0];
  return item.kindLabel;
}

export function PcTownBrowseCard({ item }: Props) {
  const [saved, setSaved] = useState(false);
  const badge = badgeOf(item);
  const pills = item.tags.filter((tag) => tag !== badge).slice(0, 2);
  const hasImage = Boolean(item.imageUrl?.trim());

  return (
    <Link
      href={item.href}
      className="group flex h-full flex-col overflow-hidden rounded-[16px] border border-[#e6eee6] bg-white shadow-[0_2px_10px_rgba(22,40,28,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(22,40,28,0.08)]"
      aria-label={`${item.title}の詳細を見る`}
    >
      <div className="relative aspect-[2/1] w-full overflow-hidden bg-[#e7f0e6]">
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl!}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#e7f3ea] to-[#f6f1e6]" aria-hidden />
        )}
        <span
          className="absolute left-2.5 top-2.5 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
          style={{ background: BADGE_COLOR[badge] ?? "#3d6fbf" }}
        >
          {badge}
        </span>
        <button
          type="button"
          aria-label={saved ? "保存を解除" : "保存する"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSaved((value) => !value);
          }}
          className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 shadow-sm"
        >
          <Bookmark
            className={cn("h-3.5 w-3.5", saved ? "fill-[#E07A3D] text-[#E07A3D]" : "text-[#5c6b60]")}
            aria-hidden
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col px-2.5 pb-2 pt-2">
        <h3 className="line-clamp-2 min-h-[2.4em] text-[13px] font-semibold leading-snug text-[#1a2e22]">
          {item.title}
        </h3>
        <p className="mt-1 flex items-center gap-1 text-[11px] text-[#6d6254]">
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#e07a3d]" aria-hidden />
          <span className="line-clamp-1">
            {item.metaLabel}
            {item.timeLabel ? ` ${item.timeLabel}` : ""}
          </span>
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[#6d6254]">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-[#e07a3d]" aria-hidden />
          <span className="line-clamp-1">{item.areaLabel}</span>
        </p>
        {pills.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {pills.map((pill) => (
              <span
                key={pill}
                className="rounded-full bg-[#f4f7f2] px-2 py-0.5 text-[10px] text-[#5d6e62]"
              >
                {pill}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export function PcTownBrowseCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[16px] border border-[#e6eee6] bg-white">
      <div className="aspect-[2/1] animate-pulse bg-[#e7f0e6]" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-[#e7f0e6]" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-[#e7f0e6]" />
      </div>
    </div>
  );
}
