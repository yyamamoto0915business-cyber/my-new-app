"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import type { EventWithDistance } from "./types";

type Props = {
  events: EventWithDistance[];
  selectedEventId: string | null;
  onSelectEvent: (id: string | null) => void;
  isLoading?: boolean;
  rightOffsetPx?: number;
};

const PRICE_BADGE = ({ price }: { price: number }) => {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        price === 0
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
          : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
      }`}
    >
      {price === 0 ? "無料" : "有料"}
    </span>
  );
};

export function SelectedEventCarousel({
  events,
  selectedEventId,
  onSelectEvent,
  isLoading = false,
  rightOffsetPx = 64,
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const isProgrammaticScrollRef = useRef(false);

  const selectedIndex = useMemo(() => {
    if (!selectedEventId) return -1;
    return events.findIndex((e) => e.id === selectedEventId);
  }, [events, selectedEventId]);

  const isEmpty = events.length === 0;
  const canShowCards = !isEmpty && selectedIndex >= 0;
  const isExpanded = selectedEventId != null && canShowCards;

  const scrollToIndex = (idx: number) => {
    if (!scrollerRef.current) return;
    const el = document.getElementById(`carousel-event-${events[idx]?.id}`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  // ピン/カード選択でカルーセル位置を同期
  useEffect(() => {
    if (!selectedEventId) return;
    if (selectedIndex < 0) return;
    isProgrammaticScrollRef.current = true;
    scrollToIndex(selectedIndex);
    window.setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 350);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId]);

  const handleScroll = () => {
    const container = scrollerRef.current;
    if (!container) return;
    if (isProgrammaticScrollRef.current) return;
    if (!events.length) return;

    const gapPx = 12; // gap-3
    const ratio = 0.86; // basis-[86%] 想定
    const step = container.clientWidth * ratio + gapPx;
    const idx = Math.round(container.scrollLeft / step);
    const clamped = Math.max(0, Math.min(events.length - 1, idx));

    if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = window.setTimeout(() => {
      const targetId = events[clamped]?.id;
      if (targetId && targetId !== selectedEventId) onSelectEvent(targetId);
    }, 160);
  };

  return (
    <div
      className="pointer-events-auto"
      style={{
        position: "absolute",
        left: 12,
        right: rightOffsetPx,
        bottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
        zIndex: 1100,
      }}
    >
      <div
        className={`rounded-2xl border border-zinc-200/70 bg-white/90 shadow-sm backdrop-blur dark:border-zinc-700/70 dark:bg-zinc-900/70 transition-all duration-200 ${
              isExpanded
                ? "p-2 max-h-[35vh] translate-y-0 opacity-100"
                : "p-2 max-h-[44px] overflow-hidden translate-y-[6px] opacity-95"
        }`}
      >
        {/* ハンドル（未選択時はこれだけ見せる） */}
        {!isExpanded ? (
          <button
            type="button"
            onClick={() => {
              // 未選択時は「カードを出せる」状態に寄せるため、先頭を選択
              // eventsが0件なら何もしない
              if (!events.length) return;
              onSelectEvent(events[0].id);
            }}
            className="flex w-full items-center justify-between gap-2 px-2"
            aria-label="イベントを選択"
          >
            <span className="flex items-center gap-2">
              <span className="inline-flex h-2.5 w-10 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700" />
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                {isLoading ? "探し中..." : "イベントを選択"}
              </span>
            </span>
            <span className="text-xs font-semibold text-zinc-400">›</span>
          </button>
        ) : (
          <>
            {/* 展開時：閉じるボタン＋カルーセル */}
            <div className="mb-2 flex items-start justify-between gap-2 px-1">
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                {selectedIndex + 1} / {events.length} 件
              </p>
              <button
                type="button"
                onClick={() => onSelectEvent(null)}
                className="min-h-[36px] min-w-[36px] rounded-full border border-zinc-200 bg-white text-xs font-semibold text-zinc-500 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/20 dark:hover:bg-zinc-900/40"
                aria-label="カードを閉じる"
              >
                ✕
              </button>
            </div>

            <div
              ref={scrollerRef}
              className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
              onScroll={handleScroll}
              style={{
                scrollSnapType: "x mandatory",
                maxHeight: "calc(35vh - 48px)",
              }}
            >
              {events.map((ev) => {
                const active = ev.id === selectedEventId;
                return (
                  <button
                    key={ev.id}
                    id={`carousel-event-${ev.id}`}
                    type="button"
                    onClick={() => onSelectEvent(ev.id)}
                    className="snap-center flex-none rounded-2xl border bg-white/70 p-2 text-left shadow-sm transition dark:bg-zinc-800/50"
                    style={{
                      width: "86%",
                      borderColor: active ? "var(--accent)" : undefined,
                      background: active ? "var(--accent-soft)" : undefined,
                    }}
                    aria-pressed={active}
                  >
                    <p className="line-clamp-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {ev.title}
                    </p>
                    <p className="mt-1 text-[12px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {ev.date} {ev.startTime}
                      {ev.endTime && `〜${ev.endTime}`} ・ {ev.location}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <PRICE_BADGE price={ev.price} />
                      {ev.childFriendly && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">
                          子連れOK
                        </span>
                      )}
                    </div>

                    <div className="mt-2">
                      <Link
                        href={`/events/${ev.id}`}
                        className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
                      >
                        詳細へ
                      </Link>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

