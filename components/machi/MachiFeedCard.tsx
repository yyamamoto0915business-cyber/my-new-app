"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, CalendarDays, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MachiFeedItem } from "@/lib/machi/feed";

type Props = {
  item: MachiFeedItem;
  compact?: boolean;
};

const ACCENT = "#E66B27";

export function MachiFeedCard({ item, compact }: Props) {
  const [saved, setSaved] = useState(false);
  const hasImage = Boolean(item.imageUrl?.trim());
  const isVolunteer = item.kind === "volunteer";
  const isEvent = item.kind === "event";
  const isKitchen = item.kind === "kitchen_car";
  const isSale = item.kindLabel === "特売";

  const badgeClass = isVolunteer
    ? "bg-[#2D7A4F]"
    : isEvent
      ? "bg-[#1a2b3c]"
      : isKitchen
        ? "bg-[#d4843a]"
        : isSale
          ? "bg-[#c45a1a]"
          : "bg-[#b56a2e]";

  const gradientClass = isVolunteer
    ? "from-[#e8f4ec] via-[#eef6f2] to-[#f5f0e6]"
    : isEvent
      ? "from-[#e8eef4] via-[#eef2f6] to-[#f0f4f8]"
      : "from-[#f7efe6] via-[#f3ebe3] to-[#efe6d8]";

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-[14px] border border-[#ebe4dc] bg-white shadow-[0_2px_10px_rgba(15,23,42,0.04)] transition hover:border-[#e0c4a8] hover:shadow-[0_4px_16px_rgba(160,100,40,0.1)]",
        compact && "min-w-[148px] max-w-[168px] shrink-0",
      )}
      aria-label={`${item.title}の詳細を見る`}
    >
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-[#f3ebe3]">
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl!}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br",
              gradientClass,
            )}
            aria-hidden
          />
        )}
        <span
          className={cn(
            "absolute left-2 top-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium text-white",
            badgeClass,
          )}
        >
          {item.kindLabel}
        </span>
        <button
          type="button"
          aria-label={saved ? "保存を解除" : "保存する"}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setSaved((v) => !v);
          }}
          className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:bg-white"
        >
          <Bookmark
            className={cn(
              "h-3.5 w-3.5",
              saved ? "fill-[#E66B27] text-[#E66B27]" : "text-[#566358]",
            )}
            aria-hidden
          />
        </button>
      </div>

      <div className="flex min-h-[104px] flex-1 flex-col px-3 pb-3 pt-2.5">
        <h3 className="mb-2 line-clamp-2 min-h-[2.6em] text-[13px] font-semibold leading-[1.3] text-[#1A2214]">
          {item.title}
        </h3>
        <p className="mb-1 flex shrink-0 items-center gap-1 text-[11px] text-[#7a6a58]">
          <CalendarDays
            className="h-3 w-3 shrink-0"
            style={{ color: ACCENT }}
            aria-hidden
          />
          <span className="line-clamp-1">
            {item.metaLabel}
            {item.timeLabel ? ` ${item.timeLabel}` : ""}
          </span>
        </p>
        <p className="mt-auto flex shrink-0 items-center gap-1 text-[11px] text-[#7a6a58]">
          <MapPin className="h-3 w-3 shrink-0" style={{ color: ACCENT }} aria-hidden />
          <span className="line-clamp-1">{item.areaLabel}</span>
        </p>
      </div>
    </Link>
  );
}
