"use client";

import Link from "next/link";
import type { Event } from "@/lib/db/types";

type Props = {
  events: Event[];
};

/** 地図風点線パターン SVG */
function MapTexturePattern() {
  return (
    <svg className="absolute inset-0 h-full w-full opacity-[0.06]" aria-hidden>
      <defs>
        <pattern
          id="map-grid"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#map-grid)" />
    </svg>
  );
}

export function FootprintRoute({ events }: Props) {
  const items = events.slice(0, 3);

  if (items.length === 0) return null;

  return (
    <section className="mb-10" aria-label="今日の足あとルート">
      <Link
        href="/events"
        className="group block overflow-hidden rounded-2xl border border-[var(--mg-line)] shadow-sm transition-shadow hover:shadow-md"
        style={{ backgroundColor: "var(--mg-paper)" }}
      >
        <div className="relative flex flex-col md:flex-row md:items-center md:gap-6">
          {/* 薄い地図テクスチャ背景 */}
          <div className="relative min-h-[140px] flex-1 overflow-hidden p-6 md:p-8">
            <MapTexturePattern />
            <div className="relative flex flex-1 flex-col justify-center gap-4 md:flex-row md:items-center md:gap-6">
              {items.map((e, i) => (
                <div
                  key={e.id}
                  className="flex items-center gap-3 md:flex-1 md:justify-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2 md:flex-col md:gap-1 md:text-center">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="truncate font-serif text-sm font-semibold text-zinc-800 dark:text-zinc-200 md:line-clamp-2">
                      {e.title}
                    </span>
                  </div>
                  {i < items.length - 1 && (
                    <div
                      className="hidden shrink-0 md:flex md:flex-1 md:items-center md:justify-center"
                      aria-hidden
                    >
                      <span className="inline-block h-0.5 flex-1 max-w-[60px] border-t-2 border-dashed border-zinc-400/60" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* スマホ用：縦に点線 */}
            <div className="relative mt-2 flex justify-center gap-2 md:hidden">
              {items.map((_, i) => (
                <span key={i} className="text-zinc-400">
                  ●
                </span>
              ))}
            </div>
          </div>
          <div className="shrink-0 border-t border-[var(--mg-line)] px-6 py-4 md:border-t-0 md:border-l md:px-6 md:py-6">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] group-hover:underline">
              このルートを見る
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </Link>
    </section>
  );
}
