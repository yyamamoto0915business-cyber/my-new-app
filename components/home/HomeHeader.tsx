"use client";

import Link from "next/link";
import { Suspense } from "react";
import { NotificationBell } from "@/components/notification-bell";
import { ParticipationPassIcon } from "@/components/pass/ParticipationPassIcon";

type Props = {
  platformTitle: string;
  onOpenBookmarks: () => void;
  bookmarkCount?: number;
};

/** ファーストビュー上部：ロゴ＋ブックマーク・参加パス・通知ベル（検索・地域はHeroSectionへ） */
export function HomeHeader({
  platformTitle,
  onOpenBookmarks,
  bookmarkCount = 0,
}: Props) {
  return (
    <header className="sticky top-0 z-[100] hidden border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <h1 className="min-w-0 shrink font-serif text-lg font-semibold text-slate-900 sm:text-xl">
          {platformTitle}
        </h1>
        <div className="flex shrink-0 items-center justify-end gap-2">
          <button
            type="button"
            onClick={onOpenBookmarks}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[var(--accent)] transition-colors hover:bg-[var(--accent-soft)]"
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
            href="/pass"
            className="flex h-10 shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 text-sm text-[var(--accent)] transition-colors hover:bg-[var(--accent-soft)] sm:h-11 sm:px-4 sm:text-base"
            aria-label="参加パス"
          >
            <ParticipationPassIcon className="h-6 w-6 shrink-0 sm:mr-1" stroke="currentColor" />
            <span className="whitespace-nowrap">参加パス</span>
          </Link>
          <Suspense fallback={null}>
            <NotificationBell />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
