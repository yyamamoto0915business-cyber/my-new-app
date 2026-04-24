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
    <header className="overflow-hidden rounded-2xl">
      {/* 七宝つなぎ和柄ダークヘッダー */}
      <div className="relative overflow-hidden px-5 py-5" style={{ background: "#1e3020" }}>
        {/* 七宝つなぎ SVG */}
        <svg
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <pattern id="profile-shippou" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="10" fill="none" stroke="white" strokeWidth="0.8" />
              <circle cx="0" cy="0" r="10" fill="none" stroke="white" strokeWidth="0.8" />
              <circle cx="20" cy="0" r="10" fill="none" stroke="white" strokeWidth="0.8" />
              <circle cx="0" cy="20" r="10" fill="none" stroke="white" strokeWidth="0.8" />
              <circle cx="20" cy="20" r="10" fill="none" stroke="white" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#profile-shippou)" opacity="0.08" />
        </svg>
        {/* 家紋風円紋 top-right */}
        <svg
          className="absolute right-4 top-4 h-14 w-14 opacity-[0.15]"
          viewBox="0 0 56 56"
          aria-hidden="true"
        >
          <circle cx="28" cy="28" r="26" fill="none" stroke="white" strokeWidth="1.2" />
          <circle cx="28" cy="28" r="17" fill="none" stroke="white" strokeWidth="0.8" />
          <line x1="2" y1="28" x2="54" y2="28" stroke="white" strokeWidth="0.8" />
          <line x1="28" y1="2" x2="28" y2="54" stroke="white" strokeWidth="0.8" />
        </svg>

        <div className="relative flex gap-4">
          {/* アバター */}
          <button
            type="button"
            onClick={() => userId && setShowAvatarModal(true)}
            className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-[#a8c8a4]/60 bg-[#2c4a2c] ${
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
              <div className="flex h-full w-full items-center justify-center text-[#a8c8a4]">
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
            <span className="inline-flex rounded-full border border-[#a8ccbc] bg-[#d8ece4]/20 px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-[#a8c8a4]">
              会員
            </span>
            <h1
              className="mt-1 font-serif text-[18px] font-bold text-[#f4f0e8]"
              style={{ fontFamily: "'Shippori Mincho', 'Noto Serif JP', serif" }}
            >
              {displayName || "ゲスト"}
            </h1>
            <p className="mt-0.5 line-clamp-1 text-[12px] text-[#a8c8a4]">
              {shortIntro}
            </p>
          </div>
        </div>
      </div>

      {/* モードチップ + ログアウト（ライト帯） */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-[#ccc4b4] bg-[#faf8f2] px-5 py-3" role="tablist">
        {MODE_CHIPS.map((chip) => (
          <button
            key={chip.id}
            role="tab"
            aria-selected={activeMode === chip.id}
            type="button"
            onClick={() => onModeChange(chip.id)}
            className={`min-h-[34px] rounded-full px-[14px] py-[7px] text-[12px] font-medium transition-colors ${
              activeMode === chip.id
                ? "bg-[#1e3848] text-[#f4f0e8]"
                : "border border-[#ccc4b4] bg-white text-[#3a3428] hover:bg-[#eef6f2]"
            }`}
          >
            {chip.label}
          </button>
        ))}
        {userId && (
          <button
            type="button"
            onClick={handleLogout}
            className="ml-auto min-h-[34px] rounded-full border border-[#ccc4b4] bg-white px-3 py-[7px] text-[11px] font-medium text-[#6a6258] transition-colors hover:bg-[#f4f0e8]"
          >
            {loggingOut ? "ログアウト中..." : "ログアウト"}
          </button>
        )}
      </div>
    </header>
  );
}
