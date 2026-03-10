"use client";

import Link from "next/link";

type Props = {
  platformTitle: string;
  onOpenBookmarks: () => void;
  bookmarkCount?: number;
};

/** ファーストビュー上部：ロゴ＋ブックマーク・ストーリーのみ（検索・地域はHeroSectionへ） */
export function HomeHeader({
  platformTitle,
  onOpenBookmarks,
  bookmarkCount = 0,
}: Props) {
  return (
    <header className="sticky top-0 z-[100] border-b border-slate-200/80 bg-white/90 backdrop-blur-md pt-[env(safe-area-inset-top,0px)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3 pr-12 sm:px-6 sm:pr-4">
        <h1 className="min-w-0 shrink font-serif text-lg font-semibold text-slate-900 sm:text-xl">
          {platformTitle}
        </h1>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onOpenBookmarks}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-slate-200 bg-white text-[var(--accent)] transition-colors hover:bg-[var(--accent-soft)]"
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
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-slate-200 bg-white text-[var(--accent)] transition-colors hover:bg-[var(--accent-soft)] md:rounded-lg md:px-3"
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
    </header>
  );
}
