"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AvatarChangeModal } from "./avatar-change-modal";

type ProfileSummary = {
  displayName: string;
  region?: string | null;
  avatarUrl?: string | null;
  completionPercent: number;
};

type Props = {
  profile: ProfileSummary;
  unreadCount?: number;
  userId?: string | null;
  onAvatarChange?: (newUrl: string | null) => void;
};

export function ProfileSummaryCard({ profile, unreadCount = 0, userId, onAvatarChange }: Props) {
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const handleAvatarChange = (newUrl: string | null) => {
    onAvatarChange?.(newUrl);
  };

  return (
    <div className="mg-card-glow rounded-xl border border-[var(--mg-line)] bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900/90">
      <div className="flex items-start gap-4">
        {/* アイコン（タップで変更・LINE風） */}
        <button
          type="button"
          onClick={() => userId && setShowAvatarModal(true)}
          className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700 ${
            userId ? "cursor-pointer hover:opacity-90 active:opacity-80" : "cursor-default"
          }`}
          disabled={!userId}
          aria-label="アイコンを変更"
        >
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt={profile.displayName || "プロフィール"}
              fill
              className="object-cover"
              unoptimized={!profile.avatarUrl.includes("supabase.co")}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-[var(--foreground-muted)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {userId && (
                <span className="mt-0.5 text-[10px]">タップで追加</span>
              )}
            </div>
          )}
          {userId && (
            <span className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </span>
          )}
        </button>
        {userId && (
          <AvatarChangeModal
            isOpen={showAvatarModal}
            onClose={() => setShowAvatarModal(false)}
            currentAvatarUrl={profile.avatarUrl}
            onAvatarChange={handleAvatarChange}
            userId={userId}
            role="participant"
          />
        )}

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

          {/* クイックアクション: 主・副ボタンのみ */}
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/profile/edit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 active:opacity-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              プロフィールを完成させる
            </Link>
            <Link
              href="/messages"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:active:bg-zinc-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              メッセージ
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
