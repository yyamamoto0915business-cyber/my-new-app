"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ProfileMode } from "./mode-switcher";
import { AvatarChangeModal } from "./avatar-change-modal";

const MODE_CHIPS: { id: ProfileMode; label: string }[] = [
  { id: "participant", label: "探す" },
  { id: "volunteer", label: "ボランティア" },
  { id: "organizer", label: "主催" },
];

type Props = {
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  region?: string | null;
  activeMode: ProfileMode;
  onModeChange: (mode: ProfileMode) => void;
  userId?: string | null;
  onAvatarChange?: (url: string | null) => void;
};

/** マイページ型ヘッダー：アイコン・名前・紹介文・モードチップ */
export function MypageHeader({
  displayName,
  avatarUrl,
  bio,
  region,
  activeMode,
  onModeChange,
  userId,
  onAvatarChange,
}: Props) {
  const router = useRouter();
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const shortIntro = bio?.slice(0, 60) ?? region ?? "地域のイベントに参加してみよう";

  const handleAvatarChange = (newUrl: string | null) => {
    onAvatarChange?.(newUrl);
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    try {
      setLoggingOut(true);
      const supabase = createClient();
      if (!supabase) throw new Error("Supabase not configured");
      await supabase.auth.signOut();
      router.replace("/auth");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="rounded-2xl border border-zinc-200/80 bg-white px-5 py-5 shadow-sm dark:border-zinc-700/60 dark:bg-zinc-900/95 dark:shadow-none sm:px-6 sm:py-6">
      <div className="flex gap-4 sm:gap-5">
        {/* アバター */}
        <button
          type="button"
          onClick={() => userId && setShowAvatarModal(true)}
          className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800 ${
            userId ? "cursor-pointer transition-opacity active:opacity-90" : "cursor-default"
          }`}
          disabled={!userId}
          aria-label="アイコンを変更"
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName || "プロフィール"}
              fill
              className="object-cover"
              unoptimized={!avatarUrl.includes("supabase.co")}
              sizes="64px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-400 dark:text-zinc-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </button>
        {userId && (
          <AvatarChangeModal
            isOpen={showAvatarModal}
            onClose={() => setShowAvatarModal(false)}
            currentAvatarUrl={avatarUrl}
            onAvatarChange={handleAvatarChange}
            userId={userId}
          />
        )}

        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {displayName || "ゲスト"}
          </h1>
          <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
            {shortIntro}
            {bio && bio.length > 60 ? "…" : ""}
          </p>

          {/* モードチップ + ログアウト */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5" role="tablist">
            {MODE_CHIPS.map((chip) => (
              <button
                key={chip.id}
                role="tab"
                aria-selected={activeMode === chip.id}
                type="button"
                onClick={() => onModeChange(chip.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeMode === chip.id
                    ? "bg-[var(--accent)] text-white dark:bg-[var(--accent)]"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                }`}
              >
                {chip.label}
              </button>
            ))}
            {userId && (
              <button
                type="button"
                onClick={handleLogout}
                className="ml-1 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-500 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                {loggingOut ? "ログアウト中..." : "ログアウト"}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
