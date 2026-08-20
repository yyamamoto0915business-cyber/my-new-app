"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Star, Sparkles, ArrowRight } from "lucide-react";
import type { Event } from "@/lib/db/types";
import type { StoreRecord } from "@/lib/stores/types";
import type { VolunteerRoleWithEvent } from "@/lib/volunteer-utils";
import {
  buildMachiFeed,
  eventsToMachiItems,
  type MachiFeedItem,
} from "@/lib/machi/feed";
import { cn } from "@/lib/utils";

type Props = {
  events: Event[];
  stores: StoreRecord[];
  volunteers: VolunteerRoleWithEvent[];
  loading: boolean;
};

function FeaturedRow({ item }: { item: MachiFeedItem }) {
  const isVolunteer = item.kind === "volunteer";
  return (
    <Link
      href={item.href}
      className="flex items-center gap-2.5 rounded-[10px] px-1.5 py-1.5 transition hover:bg-[#faf7f2]"
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[9px] bg-[#f3ebe3]">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[9px] font-medium text-[#9a7a58]">
            {item.kindLabel}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[9px] font-medium",
              isVolunteer
                ? "bg-[#e8f4ec] text-[#2D7A4F]"
                : "bg-[#f5ebe0] text-[#b56a2e]",
            )}
          >
            {item.kindLabel}
          </span>
          <span className="truncate text-[10px] text-[#9a8a78]">{item.metaLabel}</span>
        </div>
        <p className="mt-0.5 truncate text-[12px] font-semibold text-[#1A2214]">
          {item.title}
        </p>
        <p className="truncate text-[10px] text-[#8a7a68]">{item.areaLabel}</p>
      </div>
    </Link>
  );
}

/** まちの情報：右サイド（注目情報＋はじめての方へ） */
export function PcTownSidebar({
  events,
  stores,
  volunteers,
  loading,
}: Props) {
  const featured = useMemo(() => {
    const items = [
      ...eventsToMachiItems(events),
      ...buildMachiFeed(stores, volunteers),
    ].sort((a, b) => b.sortAt - a.sortAt);
    return items.slice(0, 4);
  }, [events, stores, volunteers]);

  return (
    <aside className="space-y-3">
      {/* 注目情報 */}
      <section className="rounded-[16px] border border-[#ebe4dc] bg-white p-3.5 shadow-[0_1px_4px_rgba(15,23,42,0.03)]">
        <div className="mb-2 flex items-center gap-1.5">
          <Star className="h-4 w-4 fill-[#e8c838] text-[#e8c838]" aria-hidden />
          <h2 className="text-[13.5px] font-semibold text-[#1A2214]">注目情報</h2>
        </div>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-[9px] bg-[#f3ebe3]" />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <p className="py-4 text-center text-[12px] text-[#9a8a78]">
            注目情報はまだありません
          </p>
        ) : (
          <div className="-mx-1.5 divide-y divide-[#f2ede6]">
            {featured.map((item) => (
              <FeaturedRow key={`feat-${item.id}`} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* はじめての方へ */}
      <section className="rounded-[16px] border border-[#dbe9df] bg-[#f4faf5] p-4 shadow-[0_1px_4px_rgba(15,23,42,0.03)]">
        <div className="mb-1.5 flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-[#2f7d4e]" aria-hidden />
          <h2 className="text-[13.5px] font-semibold text-[#1a3e28]">はじめての方へ</h2>
        </div>
        <p className="text-[11px] leading-relaxed text-[#3d5c48]">
          MachiGlyphの楽しみ方や使い方を、ガイドでご紹介します。
        </p>
        <Link
          href="/guide"
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1 rounded-[10px] bg-[#2f7d4e] text-[12px] font-semibold text-white transition hover:bg-[#2a6f46]"
        >
          ガイドを見る
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>
    </aside>
  );
}
