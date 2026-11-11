"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CalendarDays, ChevronRight, MapPin, Megaphone } from "lucide-react";
import type { Event } from "@/lib/db/types";
import type { CategoryKey } from "@/lib/categories";
import type { StoreRecord } from "@/lib/stores/types";
import type { VolunteerRoleWithEvent } from "@/lib/volunteer-utils";
import type { PublicOrganizerGame } from "@/lib/organizer/public-games";
import { buildRecommendedFeed, type MachiFeedItem } from "@/lib/machi/feed";
import { cn } from "@/lib/utils";

const BANNER_COUNT = 3;

type Props = {
  events: Event[];
  stores: StoreRecord[];
  volunteers: VolunteerRoleWithEvent[];
  games: PublicOrganizerGame[];
  loading: boolean;
  areaPreference: string;
  categoryPrefs: CategoryKey[];
};

function Banner({ item, priority }: { item: MachiFeedItem; priority: boolean }) {
  // 時刻は秒まで入っていることがあるので「10:00」の形にそろえる
  const when = [item.metaLabel, item.timeLabel]
    .filter(Boolean)
    .join(" ")
    .replace(/(\d{1,2}:\d{2}):\d{2}/g, "$1");
  return (
    <Link
      href={item.href}
      className="relative block aspect-[2/1] w-full shrink-0 snap-center overflow-hidden rounded-[22px] bg-[#2f5e43]"
      aria-label={`${item.title}を見る`}
    >
      {item.imageUrl ? (
        <Image
          src={item.imageUrl}
          alt=""
          fill
          priority={priority}
          sizes="100vw"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#3d7a55] to-[#1f4a33]" aria-hidden />
      )}
      {/* 文字を読みやすくする影。画像に文字が入っていてもタイトルが負けないよう、下半分は濃くする */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent"
        aria-hidden
      />

      <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-[#1f5e3a]">
        <Megaphone className="h-3.5 w-3.5" aria-hidden />
        注目のまち情報
      </span>

      <div className="absolute inset-x-0 bottom-0 px-4 pb-3.5 pr-14">
        <p className="line-clamp-2 text-[20px] font-bold leading-[1.3] text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.45)]">
          {item.title}
        </p>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-white/95">
          {when && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              {when}
            </span>
          )}
          {item.areaLabel && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">{item.areaLabel}</span>
            </span>
          )}
        </p>
      </div>

      <span
        className="absolute bottom-1/2 right-3 flex h-9 w-9 translate-y-1/2 items-center justify-center rounded-full bg-white text-[#1f5e3a] shadow-md"
        aria-hidden
      >
        <ChevronRight className="h-5 w-5" />
      </span>
    </Link>
  );
}

/**
 * バナーに出すもの：おすすめの上位から、写真のあるものを先にして3件。
 * 下の「おすすめ」で同じものを出さないよう、ホームからも呼ぶ。
 */
export function selectFeaturedItems(
  events: Event[],
  stores: StoreRecord[],
  volunteers: VolunteerRoleWithEvent[],
  games: PublicOrganizerGame[],
  areaPreference: string,
  categoryPrefs: CategoryKey[]
): MachiFeedItem[] {
  const feed = buildRecommendedFeed(events, stores, volunteers, {
    areaPreference,
    categoryPrefs,
    limit: 12,
    games,
  });
  // 大きく見せるので、写真のあるものを先にする
  const withImage = feed.filter((i) => i.imageUrl);
  const without = feed.filter((i) => !i.imageUrl);
  return [...withImage, ...without].slice(0, BANNER_COUNT);
}

/** まちの情報（スマホ）：「注目のまち情報」の大きなバナー。おすすめの上位を横にめくって見せる */
export function MobileFeaturedBanner({
  events,
  stores,
  volunteers,
  games,
  loading,
  areaPreference,
  categoryPrefs,
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const items = useMemo(
    () => selectFeaturedItems(events, stores, volunteers, games, areaPreference, categoryPrefs),
    [events, stores, volunteers, games, areaPreference, categoryPrefs]
  );

  if (loading) {
    return <div className="aspect-[2/1] w-full animate-pulse rounded-[22px] bg-[#e5ede6]" />;
  }
  if (items.length === 0) return null;

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const next = Math.round(el.scrollLeft / el.clientWidth);
    if (next !== index) setIndex(next);
  };

  return (
    <section aria-label="注目のまち情報" className="relative">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-[22px] shadow-[0_8px_24px_rgba(22,56,40,0.16)] scrollbar-hide"
      >
        {items.map((item, i) => (
          <Banner key={item.id} item={item} priority={i === 0} />
        ))}
      </div>
      {items.length > 1 && (
        <div className="pointer-events-none absolute bottom-3 right-4 flex gap-1.5" aria-hidden>
          {items.map((item, i) => (
            <span
              key={item.id}
              className={cn(
                "h-2 w-2 rounded-full transition",
                i === index ? "bg-white" : "bg-white/50"
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
