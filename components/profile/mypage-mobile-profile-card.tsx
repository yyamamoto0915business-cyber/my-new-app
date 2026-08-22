"use client";

import Link from "next/link";
import Image from "next/image";
import { ProfileBannerAvatar } from "./profile-banner-avatar";
import { AccountVisibilityChip } from "./account-visibility-chip";

const MYPAGE_BG = "/profile/mypage-bg.png";
const MG_GREEN = "#48BB78";
const MG_GREEN_DARK = "#3d8a5c";
const MG_GREEN_SOFT = "#eaf4ee";
const MG_MUTED = "#8c8a84";
const MG_LINE = "#d4d2cc";

type SocialCounts = {
  album: number;
  followers: number;
  following: number;
};

const SOCIAL_ITEMS = (social: SocialCounts) =>
  [
    { href: "/profile/posts", value: social.album, label: "マイアルバム" },
    { href: "/profile/follows?tab=followers", value: social.followers, label: "フォロワー" },
    { href: "/profile/follows?tab=following", value: social.following, label: "フォロー中" },
  ] as const;

type StatItem = {
  label: string;
  shortLabel: string;
  href: string;
  icon: React.ReactNode;
};

type Props = {
  displayName: string;
  avatarUrl: string | null;
  bio?: string | null;
  region?: string | null;
  isOrganizerRegistered: boolean;
  onLogout: () => void;
  /** false のときヘッダー内ログアウトを隠す（設定カード側に出す） */
  showLogout?: boolean;
  social?: SocialCounts;
};

function SocialCountLinks({
  social,
  compact,
}: {
  social: SocialCounts;
  compact?: boolean;
}) {
  return SOCIAL_ITEMS(social).map((item, i) => (
    <Link
      key={item.href}
      href={item.href}
      className={
        compact
          ? `flex min-w-[4.75rem] flex-col items-center justify-center gap-0.5 px-3 py-1 transition-colors hover:bg-white/80 ${
              i > 0 ? "border-l border-[#dfe6e1]/80" : ""
            }`
          : `flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 py-1.5 transition-colors hover:bg-[#f7faf8] active:bg-[#eaf4ee] ${
              i > 0 ? "border-l border-[#eceae3]" : ""
            }`
      }
    >
      <span
        className={`font-semibold tabular-nums tracking-tight text-[#18181a] ${
          compact ? "text-[22px] leading-none" : "text-[17px]"
        }`}
      >
        {item.value}
      </span>
      <span className="whitespace-nowrap text-[10px] tracking-[0.06em] text-[#5c5a56]">
        {item.label}
      </span>
    </Link>
  ));
}

function StatCell({ label, shortLabel, href, icon }: StatItem) {
  return (
    <Link
      href={href}
      className="flex min-h-[64px] min-w-0 flex-1 flex-col items-center justify-start gap-1 bg-[#ffffff] px-1 py-2 text-center transition-colors hover:bg-[#f7faf8] active:bg-[#eaf4ee] min-[900px]:min-h-[36px] min-[900px]:flex-none min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-center min-[900px]:gap-1.5 min-[900px]:rounded-full min-[900px]:bg-white/70 min-[900px]:px-2 min-[900px]:py-1 min-[900px]:hover:bg-white"
      aria-label={label}
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full min-[900px]:h-8 min-[900px]:w-8"
        style={{ backgroundColor: MG_GREEN_SOFT, color: MG_GREEN_DARK }}
      >
        {icon}
      </div>
      <p className="min-h-[2.4em] max-w-[4.75rem] text-[11px] font-medium leading-snug tracking-[0.02em] text-[#5c5a56] min-[900px]:min-h-0 min-[900px]:max-w-none min-[900px]:text-[12px]">
        <span className="min-[900px]:hidden">{label}</span>
        <span className="hidden min-[900px]:inline">{shortLabel}</span>
      </p>
    </Link>
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
  region,
  isOrganizerRegistered,
  onLogout,
  showLogout = true,
  social,
}: Props) {
  const organizerHref = isOrganizerRegistered ? "/organizer" : "/organizer/register";
  const planHref = isOrganizerRegistered ? "/organizer/settings/plan" : "/organizer/register";

  const statItems: StatItem[] = [
    {
      label: "投稿",
      shortLabel: "投稿",
      href: "/profile/posts",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
        </svg>
      ),
    },
    {
      label: "主催ダッシュボード",
      shortLabel: "主催",
      href: organizerHref,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
    {
      label: "お気に入り",
      shortLabel: "お気に入り",
      href: "/saved",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
      ),
    },
    {
      label: "プラン",
      shortLabel: "プラン",
      href: planHref,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
          <path d="M12 2l2.4 6.8H22l-6.2 4.4 2.4 6.8L12 16l-6.2 4 2.4-6.8L2 8.8h7.6L12 2z" />
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
            sizes="(max-width: 899px) 100vw, 1280px"
          />
        </div>
        <div
          className="pointer-events-none absolute inset-0 min-[900px]:hidden"
          style={{
            background:
              "linear-gradient(90deg, #ffffff 0%, rgba(255,255,255,.94) 30%, rgba(255,255,255,.62) 48%, rgba(255,255,255,.18) 68%, transparent 88%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 hidden min-[900px]:block"
          style={{
            background:
              "linear-gradient(90deg, #ffffff 0%, rgba(255,255,255,.86) 16%, rgba(255,255,255,.42) 36%, rgba(255,255,255,.1) 56%, transparent 74%)",
          }}
        />

        <div className="relative z-[1] px-3 pb-2 pt-2 min-[900px]:px-5 min-[900px]:py-3">
          <div className="flex items-center justify-between gap-3 min-[900px]:gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 min-[900px]:gap-3">
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

              <div className="min-w-0 shrink min-[900px]:flex min-[900px]:min-w-0 min-[900px]:items-center min-[900px]:gap-2.5">
                <p
                  className="text-[9px] font-semibold tracking-[0.22em] min-[900px]:hidden"
                  style={{ color: MG_GREEN_DARK }}
                >
                  MY PAGE
                </p>
                <div className="flex min-w-0 items-center gap-1.5">
                  <h1
                    className="mt-px min-w-0 truncate text-[17px] font-bold leading-tight text-[#18181a] min-[900px]:mt-0 min-[900px]:max-w-[9rem] min-[900px]:text-[18px]"
                    style={{ fontFamily: "'Noto Serif JP', serif" }}
                  >
                    {displayName}
                  </h1>
                  <AccountVisibilityChip className="mt-0 shrink-0" />
                </div>
                {region && (
                  <p className="mt-0.5 flex min-w-0 items-center gap-1 text-[11px] min-[900px]:mt-0" style={{ color: MG_MUTED }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span className="truncate">{region}</span>
                  </p>
                )}
              </div>

              {social ? (
                <div className="hidden shrink-0 items-stretch overflow-hidden rounded-2xl bg-white/65 shadow-sm ring-1 ring-white/80 backdrop-blur-sm min-[900px]:flex">
                  <SocialCountLinks social={social} compact />
                </div>
              ) : null}

              <nav
                className="hidden min-w-0 shrink-0 items-center gap-0.5 min-[900px]:flex"
                aria-label="マイページメニュー"
              >
                {statItems.map((item) => (
                  <StatCell key={item.label} {...item} />
                ))}
              </nav>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <Link
                href="/profile/edit"
                className="inline-flex min-h-[28px] items-center gap-1 rounded-full border bg-white px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap shadow-sm transition-colors hover:bg-[#fafaf8]"
                style={{ borderColor: MG_GREEN, color: MG_GREEN_DARK }}
              >
                <PencilIcon />
                編集
              </Link>
              {showLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex min-h-[30px] items-center gap-1 rounded-full border bg-white px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap shadow-sm transition-colors hover:bg-[#fafaf8]"
                  style={{ borderColor: MG_LINE, color: MG_MUTED }}
                >
                  <LogoutIcon />
                  ログアウト
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {social ? (
        <div className="relative z-[2] flex items-stretch border-t border-[#eceae3] bg-[#ffffff] min-[900px]:hidden">
          <SocialCountLinks social={social} />
        </div>
      ) : null}

      <div className="relative z-[2] grid grid-cols-4 divide-x divide-[#eceae3] border-t border-[#eceae3] bg-[#ffffff] min-[900px]:hidden">
        {statItems.map((item) => (
          <StatCell key={item.label} {...item} />
        ))}
      </div>
    </section>
  );
}
