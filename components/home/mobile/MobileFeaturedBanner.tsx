"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CalendarDays, MapPin } from "lucide-react";
import { MobileSectionHeading } from "@/components/home/mobile/MobileSectionHeading";
import type { Event } from "@/lib/db/types";
import type { CategoryKey } from "@/lib/categories";
import type { StoreRecord } from "@/lib/stores/types";
import type { VolunteerRoleWithEvent } from "@/lib/volunteer-utils";
import type { PublicOrganizerGame } from "@/lib/organizer/public-games";
import { buildRecommendedFeed, type MachiFeedItem } from "@/lib/machi/feed";

const BANNER_COUNT = 5;

type Props = {
  events: Event[];
  stores: StoreRecord[];
  volunteers: VolunteerRoleWithEvent[];
  games: PublicOrganizerGame[];
  loading: boolean;
  areaPreference: string;
  categoryPrefs: CategoryKey[];
};

/** 時刻は秒まで入っていることがあるので「10:00」の形にそろえる */
function whenLabel(item: MachiFeedItem): string {
  return [item.metaLabel, item.timeLabel]
    .filter(Boolean)
    .join(" ")
    .replace(/(\d{1,2}:\d{2}):\d{2}/g, "$1");
}

/**
 * 注目のカード（2枚並ぶ幅）。写真は上に文字を重ねずに出し、タイトル・日付・場所は下に置く。
 * イベントの画像は文字入りのチラシが多いので、重ねると読めなくなるため。
 */
function FeaturedCard({ item, priority }: { item: MachiFeedItem; priority: boolean }) {
  const when = whenLabel(item);
  return (
    <Link
      href={item.href}
      className="flex w-[calc(50%-5px)] min-w-[156px] tablet:w-[calc(33.333%-7px)] shrink-0 snap-start flex-col overflow-hidden rounded-[18px] border border-[#ebeee8] bg-white shadow-[0_4px_14px_rgba(22,56,40,0.08)] active:scale-[0.98]"
      aria-label={`${item.title}を見る`}
    >
      <span className="relative block aspect-[4/3] w-full bg-[#eef3ef]">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt=""
            fill
            priority={priority}
            sizes="(min-width: 600px) 33vw, 50vw"
            className="object-cover"
          />
        ) : (
          // 写真がないときは、淡い緑にロゴを置く
          <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#eef6ef] to-[#dcebdf]" aria-hidden>
            <Image src="/brand/machiglyph_mark.png" alt="" width={56} height={56} unoptimized className="h-14 w-14 object-contain opacity-80" />
          </span>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-[#1f5e3a] shadow-sm">
          {item.kindLabel}
        </span>
      </span>
      <span className="flex flex-1 flex-col gap-1 px-2.5 pb-2.5 pt-2">
        <span className="line-clamp-2 text-[13px] font-bold leading-snug text-[#163828] [overflow-wrap:anywhere]">
          {item.title}
        </span>
        {when ? (
          <span className="mt-auto flex items-center gap-1 text-[11px] text-[#5f6d64]">
            <CalendarDays className="h-3 w-3 shrink-0" aria-hidden />
            <span className="truncate">{when}</span>
          </span>
        ) : null}
        {item.areaLabel ? (
          <span className="flex items-center gap-1 text-[11px] text-[#5f6d64]">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden />
            <span className="truncate">{item.areaLabel}</span>
          </span>
        ) : null}
      </span>
    </Link>
  );
}

/**
 * バナーに出すもの：おすすめの上位から、写真のあるものを先にして4件。
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
  const withImage = feed.filter((i) => i.imageUrl);
  const without = feed.filter((i) => !i.imageUrl);
  return [...withImage, ...without].slice(0, BANNER_COUNT);
}

/** まちの情報（スマホ）：「注目のまち情報」。2枚ずつ見えるカードを横にスクロールする（5件まで） */
export function MobileFeaturedBanner({
  events,
  stores,
  volunteers,
  games,
  loading,
  areaPreference,
  categoryPrefs,
}: Props) {
  const items = useMemo(
    () => selectFeaturedItems(events, stores, volunteers, games, areaPreference, categoryPrefs),
    [events, stores, volunteers, games, areaPreference, categoryPrefs]
  );

  // いま見えている左端のカード（下の点で、横に続きがあることを知らせる）
  const [first, setFirst] = useState(0);

  if (loading) {
    return (
      <div className="flex gap-2.5">
        {[0, 1].map((i) => (
          <div key={i} className="h-[210px] flex-1 animate-pulse rounded-[18px] bg-[#e5ede6]" />
        ))}
      </div>
    );
  }
  if (items.length === 0) return null;

  return (
    <section aria-label="注目のまち情報">
      <MobileSectionHeading eyebrow="FEATURED" title="注目のまち情報" />
      <div
        className="-mx-3 -my-2 flex snap-x scroll-px-3 gap-2.5 overflow-x-auto px-3 py-2 scrollbar-hide"
        onScroll={(e) => {
          const el = e.currentTarget;
          const card = el.firstElementChild as HTMLElement | null;
          if (!card) return;
          const step = card.offsetWidth + 10;
          // いちばん右まで来たら、最後の2枚を見ていることにする
          const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
          setFirst(atEnd ? Math.max(0, items.length - 2) : Math.round(el.scrollLeft / step));
        }}
      >
        {items.map((item, i) => (
          <FeaturedCard key={item.id} item={item} priority={i < 2} />
        ))}
      </div>
      {items.length > 2 ? (
        <div className="mt-2.5 flex justify-center gap-1.5" aria-hidden>
          {items.map((item, i) => (
            <span
              key={item.id}
              className={
                i === first || i === first + 1
                  ? "h-1.5 w-4 rounded-full bg-[#2f6b4f] transition-all"
                  : "h-1.5 w-1.5 rounded-full bg-[#cfdcd2] transition-all"
              }
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
