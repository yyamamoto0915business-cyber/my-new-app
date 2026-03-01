"use client";

import Link from "next/link";
import Image from "next/image";

type ProfileSummary = {
  displayName: string;
  region?: string | null;
  avatarUrl?: string | null;
  completionPercent: number;
};

type Props = {
  profile: ProfileSummary;
};

export function ProfileSummaryCard({ profile }: Props) {
  return (
    <div className="mg-card-glow rounded-xl border border-[var(--mg-line)] bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900/90">
      <div className="flex items-start gap-4">
        {/* アイコン */}
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt={profile.displayName || "プロフィール"}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl text-[var(--foreground-muted)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {profile.displayName || "ゲスト"}
          </h2>
          {profile.region && (
            <p className="mt-0.5 flex items-center gap-1 text-sm text-[var(--foreground-muted)]">
              <span>📍</span>
              {profile.region}
            </p>
          )}

          {/* プロフィール完成度 */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--foreground-muted)]">プロフィール完成度</span>
              <span className="font-medium text-[var(--accent)]">{profile.completionPercent}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all"
                style={{ width: `${profile.completionPercent}%` }}
              />
            </div>
          </div>

          {/* 通知・設定導線 */}
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/profile/edit"
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              プロフィール編集
            </Link>
            <Link
              href="/profile/settings"
              className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              通知設定
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
