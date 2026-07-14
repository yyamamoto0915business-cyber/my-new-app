"use client";

import Link from "next/link";
import Image from "next/image";
import { ProfileBannerAvatar } from "./profile-banner-avatar";

const MYPAGE_BG = "/profile/mypage-bg.png";
const MG_GREEN = "#48BB78";
const MG_GREEN_DARK = "#3d8a5c";
const MG_GREEN_SOFT = "#eaf4ee";
const MG_MUTED = "#8c8a84";
const MG_LINE = "#d4d2cc";

type StatItem = {
  label: string;
  value: string;
  icon: React.ReactNode;
};

type Props = {
  displayName: string;
  avatarUrl: string | null;
  bio?: string | null;
  region?: string | null;
  stats: {
    participated: number;
    volunteer: number;
    favorites: number;
    points: number;
  };
  onLogout: () => void;
};

function StatCell({ label, value, icon }: StatItem) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5 bg-[#ffffff] px-0.5 py-2.5 text-center">
      <div
        className="flex h-7 w-7 items-center justify-center rounded-full"
        style={{ backgroundColor: MG_GREEN_SOFT, color: MG_GREEN_DARK }}
      >
        {icon}
      </div>
      <p className="text-[10px] leading-tight text-[#6a6a64]">{label}</p>
      <p className="text-[13px] font-semibold tabular-nums text-[#18181a]">{value}</p>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export function MypageMobileProfileCard({
  displayName,
  avatarUrl,
  bio,
  region,
  stats,
  onLogout,
}: Props) {
  const statusText = bio?.trim() || "地域のイベントに参加してみよう！";

  const statItems: StatItem[] = [
    {
      label: "参加したイベント",
      value: `${stats.participated}件`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      label: "ボランティア参加",
      value: `${stats.volunteer}件`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
      ),
    },
    {
      label: "お気に入り",
      value: `${stats.favorites}件`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
      ),
    },
    {
      label: "マイポイント",
      value: `${stats.points} pt`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l3 2" />
        </svg>
      ),
    },
  ];

  return (
    <section
      className="relative z-[1] overflow-hidden rounded-[14px] border border-[#e8e6e0] bg-[#ffffff]"
      style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 12px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.04)" }}
    >
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={MYPAGE_BG}
            alt=""
            fill
            priority
            className="object-cover object-[72%_center] saturate-[1.12] contrast-[1.06]"
            sizes="(max-width: 640px) 100vw, 480px"
          />
        </div>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, #ffffff 0%, rgba(255,255,255,.94) 30%, rgba(255,255,255,.62) 48%, rgba(255,255,255,.18) 68%, transparent 88%)",
          }}
        />

        <div className="relative z-[1] flex items-start justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 flex-1 items-start gap-2.5">
            <Link href="/profile/edit" className="relative shrink-0" aria-label="プロフィールを編集">
              <div
                className="relative h-14 w-14 overflow-hidden rounded-full"
                style={{ border: "2px solid rgba(255,255,255,.9)", boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}
              >
                <ProfileBannerAvatar avatarUrl={avatarUrl} displayName={displayName} />
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-white"
                style={{ backgroundColor: MG_GREEN }}
              >
                <CameraIcon />
              </span>
            </Link>

            <div className="min-w-0 flex-1">
              <p
                className="text-[9px] font-semibold tracking-[0.22em]"
                style={{ color: MG_GREEN_DARK }}
              >
                MY PAGE
              </p>
              <h1
                className="mt-px truncate text-[18px] font-bold leading-tight text-[#18181a]"
                style={{ fontFamily: "'Noto Serif JP', serif" }}
              >
                {displayName}
              </h1>
              <p className="mt-0.5 line-clamp-2 break-words text-[11px] leading-snug text-[#52504c]">
                {statusText}
              </p>
              {region && (
                <p className="mt-0.5 flex items-center gap-1 text-[11px]" style={{ color: MG_MUTED }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span className="truncate">{region}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5 pt-0.5">
            <Link
              href="/profile/edit"
              className="inline-flex min-h-[30px] items-center gap-1.5 rounded-full border bg-white px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap shadow-sm transition-colors hover:bg-[#fafaf8]"
              style={{ borderColor: MG_GREEN, color: MG_GREEN_DARK }}
            >
              <PencilIcon />
              プロフィールを編集
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex min-h-[30px] items-center gap-1.5 rounded-full border bg-white px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap shadow-sm transition-colors hover:bg-[#fafaf8]"
              style={{ borderColor: MG_LINE, color: MG_MUTED }}
            >
              <LogoutIcon />
              ログアウト
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-[2] grid grid-cols-4 divide-x divide-[#eceae3] border-t border-[#eceae3] bg-[#ffffff]">
        {statItems.map((item) => (
          <StatCell key={item.label} {...item} />
        ))}
      </div>
    </section>
  );
}
