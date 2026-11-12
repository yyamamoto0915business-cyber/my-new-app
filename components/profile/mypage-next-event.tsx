"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight, MapPin, Ticket } from "lucide-react";
import { EventThumbnail } from "@/components/event-thumbnail";
import type { MypageNextEvent } from "@/lib/mypage-summary-types";

const WEEKDAY_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;

/** 2026-11-23 → { md: "11/23", wd: "日" } */
function dateParts(ymd: string): { m: string; d: string; wd: string } | null {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return null;
  const wd = WEEKDAY_JA[new Date(`${ymd}T12:00:00+09:00`).getUTCDay()];
  return { m: String(m), d: String(d), wd };
}

/**
 * マイページ（スマホ）：次に行くイベント。参加者がマイページを開いていちばん知りたいことなので、上のほうに置く。
 * 参加パスの予定 → 「参加予定」に入れたイベントの順で、いちばん近い1件（データはマイページの集計 API）。
 */
export function MypageNextEvent({ event }: { event: MypageNextEvent | null }) {
  return (
    <section className="flex flex-col gap-2">
      <header className="flex items-center justify-between gap-2 px-0.5">
        <h2 className="flex items-center gap-1.5 text-[14px] font-semibold text-[#18181a]">
          <CalendarDays className="h-4 w-4 text-[#216B43]" aria-hidden />
          次の予定
        </h2>
        <Link
          href="/profile/events/planned"
          className="inline-flex items-center gap-0.5 text-[12px] font-medium text-[#216B43]"
        >
          すべて見る
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </header>

      {event ? (
        <div className="overflow-hidden rounded-[14px] border border-[#e8e6e0] bg-white shadow-[0_2px_12px_rgba(0,0,0,.06),0_1px_3px_rgba(0,0,0,.04)]">
          <Link href={`/events/${event.id}`} className="flex items-stretch gap-3 p-2.5 active:bg-[#fafaf8]">
            <span className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-[10px] bg-[#eef3ef]">
              <EventThumbnail imageUrl={event.imageUrl} alt="" rounded="none" fill placeholderSize="icon" />
              {(() => {
                const p = dateParts(event.date);
                return p ? (
                  <span className="absolute left-1.5 top-1.5 flex flex-col items-center rounded-[8px] bg-white/95 px-1.5 py-0.5 leading-none shadow-sm">
                    <span className="text-[9px] font-semibold text-[#8c8a84]">{p.m}月</span>
                    <span className="text-[17px] font-bold text-[#18181a]" style={{ fontFamily: "'Noto Serif JP', serif" }}>
                      {p.d}
                    </span>
                    <span className="text-[9px] font-semibold text-[#216B43]">{p.wd}</span>
                  </span>
                ) : null;
              })()}
            </span>
            <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-0.5">
              <span className="line-clamp-2 text-[15px] font-bold leading-snug text-[#18181a]">{event.title}</span>
              {event.startTime ? (
                <span className="text-[12px] text-[#5f6d64]">
                  {event.startTime}
                  {event.endTime ? `〜${event.endTime}` : "〜"}
                </span>
              ) : null}
              {event.location ? (
                <span className="flex min-w-0 items-center gap-1 text-[11.5px] text-[#8c8a84]">
                  <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                  <span className="truncate">{event.location}</span>
                </span>
              ) : null}
            </span>
          </Link>
          <Link
            href={event.passHref}
            className="flex items-center justify-center gap-1.5 border-t border-[#eceae3] bg-[#f6faf7] py-2.5 text-[13px] font-semibold text-[#216B43] active:bg-[#eaf4ee]"
          >
            <Ticket className="h-4 w-4" aria-hidden />
            参加パスを開く
          </Link>
        </div>
      ) : (
        <Link
          href="/events"
          className="flex items-center gap-3 rounded-[14px] border border-dashed border-[#d6e3da] bg-white/70 px-4 py-3.5 active:bg-[#fafaf8]"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold text-[#18181a]">参加予定のイベントはまだありません</span>
            <span className="mt-0.5 block text-[11.5px] text-[#8c8a84]">近くのイベントを探してみましょう</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-0.5 text-[12px] font-semibold text-[#216B43]">
            探す
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </Link>
      )}
    </section>
  );
}
