"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ProfileMode } from "./mode-switcher";
import { AvatarChangeModal } from "./avatar-change-modal";
import { CommonAvatar } from "@/components/profile/common-avatar";
import type { ProfileAvatarRole } from "@/lib/profile-avatar";
import { normalizeProfileAvatarRole } from "@/lib/profile-avatar";

const MODE_CHIPS: { id: ProfileMode; label: string }[] = [
  { id: "participant", label: "探す" },
  { id: "volunteer", label: "ボランティア" },
  { id: "organizer", label: "主催" },
];

type Props = {
  displayName: string;
  avatarUrl?: string | null;
  activeProfileRole: ProfileAvatarRole;
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
  activeProfileRole,
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
  const roleFromMode: ProfileAvatarRole =
    activeMode === "organizer" ? "organizer" : "participant";
  const selectedRole = normalizeProfileAvatarRole(activeProfileRole ?? roleFromMode);

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
    <header
      className="overflow-hidden rounded-sm"
      style={{
        boxShadow: "0 0 0 3px #c8a030, 0 0 0 6px #2a1800, 0 0 0 9px #c8a030, 0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      {/* 屏風絵ダークヘッダー */}
      <div
        className="relative overflow-hidden px-5 py-5"
        style={{ background: "linear-gradient(to bottom right, #1e4868 0%, #2a5870 40%, #245858 75%, #1e3c28 100%)" }}
      >
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 900 160"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <pattern id="mypage-sg" x="0" y="0" width="44" height="25" patternUnits="userSpaceOnUse">
              <path d="M22 0 Q44 12.5 22 25 Q0 12.5 22 0Z" fill="none" stroke="#80d0e8" strokeWidth="1.1" opacity="0.14"/>
              <path d="M0 12.5 Q22 25 44 12.5" fill="none" stroke="#80d0e8" strokeWidth="0.6" opacity="0.08"/>
            </pattern>
            <pattern id="mypage-sp" x="0" y="0" width="26" height="26" patternUnits="userSpaceOnUse">
              <circle cx="13" cy="13" r="12" fill="none" stroke="#d4b040" strokeWidth="0.5" opacity="0.12"/>
              <circle cx="0"  cy="0"  r="12" fill="none" stroke="#d4b040" strokeWidth="0.5" opacity="0.12"/>
              <circle cx="26" cy="0"  r="12" fill="none" stroke="#d4b040" strokeWidth="0.5" opacity="0.12"/>
              <circle cx="0"  cy="26" r="12" fill="none" stroke="#d4b040" strokeWidth="0.5" opacity="0.12"/>
              <circle cx="26" cy="26" r="12" fill="none" stroke="#d4b040" strokeWidth="0.5" opacity="0.12"/>
            </pattern>
            <radialGradient id="mypage-k1" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#f0d860" stopOpacity="0.55"/>
              <stop offset="55%"  stopColor="#d4b040" stopOpacity="0.28"/>
              <stop offset="100%" stopColor="#d4b040" stopOpacity="0"/>
            </radialGradient>
            <linearGradient id="mypage-to" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#1e4868" stopOpacity="0.85"/>
              <stop offset="55%"  stopColor="#1e4868" stopOpacity="0.40"/>
              <stop offset="100%" stopColor="#1e4868" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#mypage-sg)"/>
          <rect width="100%" height="100%" fill="url(#mypage-sp)"/>
          <circle cx="800" cy="38" r="52" fill="#f0e478" opacity="0.18"/>
          <circle cx="800" cy="38" r="32" fill="#f8ee90" opacity="0.22"/>
          <ellipse cx="770" cy="25"  rx="170" ry="20" fill="url(#mypage-k1)" opacity="0.75"/>
          <ellipse cx="820" cy="14"  rx="115" ry="13" fill="url(#mypage-k1)" opacity="0.60"/>
          <ellipse cx="620" cy="140" rx="190" ry="22" fill="url(#mypage-k1)" opacity="0.55"/>
          <ellipse cx="700" cy="148" rx="140" ry="16" fill="url(#mypage-k1)" opacity="0.45"/>
          <path d="M840 160 Q838 180 842 140 Q845 100 838 55" stroke="#163010" strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.80"/>
          <path d="M840 110 Q800 90 740 65 Q700 48 660 38" stroke="#1e3c10" strokeWidth="4.5" fill="none" strokeLinecap="round" opacity="0.75"/>
          <path d="M840 80 Q870 62 895 42 Q910 30 918 18" stroke="#1e3c10" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.70"/>
          <ellipse cx="650" cy="32"  rx="28" ry="12" fill="#285c20" opacity="0.75" transform="rotate(-20 650 32)"/>
          <ellipse cx="697" cy="33"  rx="25" ry="12" fill="#2c6022" opacity="0.68" transform="rotate(-10 697 33)"/>
          <ellipse cx="730" cy="57"  rx="26" ry="11" fill="#285c20" opacity="0.72" transform="rotate(-15 730 57)"/>
          <ellipse cx="793" cy="68"  rx="22" ry="10" fill="#285c20" opacity="0.65" transform="rotate(-8 793 68)"/>
          <ellipse cx="902" cy="30"  rx="26" ry="11" fill="#285c20" opacity="0.70" transform="rotate(-25 902 30)"/>
          <path d="M380 130 Q480 90 590 115 Q700 140 820 108 L900 96 L900 160 L380 160Z" fill="#1a3c28" opacity="0.45"/>
          <path d="M420 145 Q520 128 638 140 Q755 152 870 128 L900 124 L900 160 L420 160Z" fill="#162e1e" opacity="0.40"/>
          <rect width="100%" height="100%" fill="url(#mypage-to)"/>
          <line x1="450" y1="0" x2="450" y2="100%" stroke="#d4b040" strokeWidth="1.0" opacity="0.18"/>
          <rect x="0" y="0"   width="100%" height="3" fill="#d4b040" opacity="0.80"/>
          <rect x="0" y="157" width="100%" height="3" fill="#d4b040" opacity="0.60"/>
        </svg>

        <div className="relative flex gap-4">
          {/* アバター */}
          <button
            type="button"
            onClick={() => userId && setShowAvatarModal(true)}
            className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-[#d4b040]/50 bg-[#1e3848] p-0 ${
              userId ? "cursor-pointer transition-opacity active:opacity-90" : "cursor-default"
            }`}
            disabled={!userId}
            aria-label="アイコンを変更"
          >
            <CommonAvatar
              avatarUrl={avatarUrl}
              displayName={displayName || "プロフィール"}
              size="lg"
              className="h-full w-full rounded-none bg-[#1e3848]"
              initialsClassName="text-[#f4f0e8]"
            />
          </button>
          {userId && (
            <AvatarChangeModal
              isOpen={showAvatarModal}
              onClose={() => setShowAvatarModal(false)}
              currentAvatarUrl={avatarUrl}
              onAvatarChange={handleAvatarChange}
              userId={userId}
              role={selectedRole}
            />
          )}

          <div className="min-w-0 flex-1">
            <span
              className="inline-block text-[9px] font-medium tracking-[0.25em]"
              style={{ color: "#d4b040" }}
            >
              MYPAGE
            </span>
            <h1
              className="mt-0.5 text-[18px] font-semibold leading-snug tracking-[0.05em] [text-shadow:0_2px_14px_rgba(0,0,0,0.45)]"
              style={{ fontFamily: "'Shippori Mincho', 'Noto Serif JP', serif", color: "#f0f6fa" }}
            >
              {displayName || "ゲスト"}
            </h1>
            <p className="mt-0.5 line-clamp-1 text-[12px] tracking-[0.06em]" style={{ color: "rgba(190,228,242,0.80)" }}>
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
