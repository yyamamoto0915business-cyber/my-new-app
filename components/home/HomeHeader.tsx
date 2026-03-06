"use client";

import Link from "next/link";
import { RegionFilter } from "@/components/region-filter";

type Props = {
  platformTitle: string;
  onOpenBookmarks: () => void;
  bookmarkCount?: number;
};

export function HomeHeader({
  platformTitle,
  onOpenBookmarks,
  bookmarkCount = 0,
}: Props) {
  return (
    <header className="sticky top-12 z-[100] border-b border-[var(--border)] bg-white/90 backdrop-blur-md sm:top-0 dark:bg-[var(--background)] pt-[env(safe-area-inset-top,0px)]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-2 py-3 pr-12 sm:pr-4">
          <h1 className="min-w-0 shrink font-serif text-lg font-semibold text-zinc-900 dark:text-zinc-100 sm:text-xl">
            {platformTitle}
          </h1>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onOpenBookmarks}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--border)] bg-white/90 text-[var(--accent)] transition-colors hover:bg-[var(--accent-soft)] dark:bg-[var(--background)] dark:hover:bg-[var(--accent-soft)]"
              aria-label={`保存済み${bookmarkCount > 0 ? `（${bookmarkCount}件）` : ""}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path
                  fillRule="evenodd"
                  d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <Link
              href="/stories"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--border)] bg-white/90 text-[var(--accent)] transition-colors hover:bg-[var(--accent-soft)] md:rounded-lg md:px-3 dark:bg-[var(--background)] dark:hover:bg-[var(--accent-soft)]"
              aria-label="ストーリー"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 md:mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <span className="hidden md:inline">ストーリー</span>
            </Link>
          </div>
        </div>
        <div className="flex flex-col gap-3 pb-3">
          <Link
            href="/events"
            className="flex min-h-[44px] items-center gap-3 rounded-xl border border-[var(--border)] bg-white/80 px-4 text-left text-sm text-zinc-500 transition-colors hover:bg-zinc-50 dark:bg-[var(--background)] dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="イベントを検索"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 shrink-0 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span>イベントを検索</span>
          </Link>
          <RegionFilter variant="chips" className="min-w-0" />
        </div>
      </div>
    </header>
  );
}
