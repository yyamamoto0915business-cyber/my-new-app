"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { BookmarkToggle } from "@/components/ui/BookmarkToggle";
import { isBookmarked, toggleBookmark } from "@/lib/bookmark-storage";

/** 横並び3枚（gap-2 × 2 = 1rem） */
export const MOBILE_VOLUNTEER_CARD_WIDTH = "calc((100% - 1rem) / 3)";

export type MobileVolunteerCardItem = {
  id: string;
  title: string;
  imageUrl?: string | null;
  dateLabel: string;
  areaLabel: string;
  tags: string[];
  href: string;
};

type Props = { item: MobileVolunteerCardItem };

export function MobileVolunteerCard({ item }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(() => isBookmarked(item.id));

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => router.push(item.href)}
      onKeyDown={(e) => e.key === "Enter" && router.push(item.href)}
      className="flex shrink-0 snap-start cursor-pointer flex-col overflow-hidden rounded-[18px] border border-[#dde9e1] bg-white shadow-[0_4px_12px_rgba(22,56,40,0.05)]"
      style={{ width: MOBILE_VOLUNTEER_CARD_WIDTH }}
      aria-label={`${item.title}の詳細を見る`}
    >
      <div className="relative aspect-[3/2] shrink-0 overflow-hidden bg-[#e8ede4]">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt="" fill className="object-cover" sizes="33vw" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#e8f4ec] via-[#eef6f2] to-[#f5f0e6]" />
        )}
        <span className="absolute left-1.5 top-1 inline-flex h-[18px] items-center rounded-md bg-[#2f6b4f]/95 px-1.5 text-[8px] font-semibold text-white ring-1 ring-[#2f6b4f]/30">
          募集中
        </span>
        <div
          className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-[#dde9e1]/80 bg-white/95 shadow-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <BookmarkToggle
            eventId={item.id}
            isActive={saved}
            onToggle={() => setSaved(toggleBookmark(item.id))}
            tone="light"
            className="!min-h-0 !min-w-0 !p-0.5 [&_svg]:h-3.5 [&_svg]:w-3.5"
          />
        </div>
      </div>

      <div className="flex flex-col gap-0.5 px-2 py-1.5">
        <p className="truncate text-[9px] leading-none text-[#6a6258]">{item.dateLabel}</p>
        <h3 className="line-clamp-1 text-[11px] font-semibold leading-tight text-[#163828]">
          {item.title}
        </h3>
        <p className="flex items-center gap-0.5 text-[9px] leading-none text-[#6a6258]">
          <MapPin className="h-2.5 w-2.5 shrink-0" aria-hidden />
          <span className="truncate">{item.areaLabel}</span>
        </p>
        {item.tags.length > 0 && (
          <div className="flex h-[18px] gap-0.5 overflow-hidden">
            {item.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex max-w-full shrink truncate rounded border border-[#dde9e1] bg-[#f7fbf8] px-1 py-px text-[8px] font-medium text-[#3d5c48]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export function MobileVolunteerCardSkeleton() {
  return (
    <div
      className="shrink-0 overflow-hidden rounded-[18px] border border-[#dde9e1] bg-white"
      style={{ width: MOBILE_VOLUNTEER_CARD_WIDTH }}
    >
      <div className="aspect-[3/2] animate-pulse bg-[#e8ede4]" />
      <div className="space-y-1 px-2 py-1.5">
        <div className="h-2 w-3/4 animate-pulse rounded bg-[#e8ede4]" />
        <div className="h-2.5 w-full animate-pulse rounded bg-[#e8ede4]" />
        <div className="h-2 w-2/3 animate-pulse rounded bg-[#e8ede4]" />
      </div>
    </div>
  );
}
