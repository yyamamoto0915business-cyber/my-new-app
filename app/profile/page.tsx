"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { useRouter } from "next/navigation";
import { SupabaseSetupGuide } from "@/components/supabase-setup-guide";
import { useUnreadCount } from "@/hooks/use-unread-count";
import { ProfilePageSkeleton } from "@/components/profile/ProfilePageSkeleton";
import { MypageMobileProfileCard } from "@/components/profile/mypage-mobile-profile-card";
import { MypageMobileFooterLinks } from "@/components/profile/mypage-mobile-footer-links";
import { MypagePcView } from "@/components/profile/mypage-pc-view";
import {
  prefetchMypageSummary,
  resetMypageSummaryPrefetch,
  type MypageSummaryResponse,
} from "@/lib/prefetch-mypage-summary";

type Tab = "quick" | "join" | "organize";

/** セクション見出し・アイコン・カード左線の色（モバイル主催・設定タブ用） */
const SECTION_THEME = {
  organize: { label: "#C05621", iconBg: "#FFFAF0", iconStroke: "#DD6B20", border: "#ED8936" },
  settings: { label: "#6B46C1", iconBg: "#FAF5FF", iconStroke: "#805AD5", border: "#9F7AEA" },
} as const;

/** リスト行ごとの色（モバイル主催・設定タブ用） */
const ROW_THEME = {
  purple: {
    rowBg: "#FAF5FF",
    rowHover: "#EDE9FE",
    accent: "#9F7AEA",
    iconBg: "#FAF5FF",
    iconStroke: "#805AD5",
    title: "#6B46C1",
    badgeBg: "#FAF5FF",
    badgeColor: "#6B46C1",
    chev: "#D6BCFA",
  },
  orange: {
    rowBg: "#FFFAF0",
    rowHover: "#FEEBC8",
    accent: "#ED8936",
    iconBg: "#FFFAF0",
    iconStroke: "#DD6B20",
    title: "#C05621",
    badgeBg: "#FFFAF0",
    badgeColor: "#C05621",
    chev: "#FBD38D",
  },
} as const;

type RowThemeKey = keyof typeof ROW_THEME;

function rowLinkStyle(theme: RowThemeKey): React.CSSProperties {
  const t = ROW_THEME[theme];
  return {
    backgroundColor: t.rowBg,
    borderLeft: `3px solid ${t.accent}`,
    ["--row-hover-bg" as string]: t.rowHover,
  };
}

const ROW_LINK_HOVER =
  "hover:[background-color:var(--row-hover-bg)] transition-colors";

function fallbackDisplayName(user: {
  user_metadata?: Record<string, unknown>;
  email?: string | null;
}): string {
  return (
    (user.user_metadata?.display_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split("@")[0] ??
    "ゲスト"
  );
}

function Chev({ stroke = "#DEDAD2" }: { stroke?: string }) {
  return (
    <svg className="shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

const MG_GREEN = "#3d8a5c";
const MG_GREEN_SOFT = "#eaf4ee";

const MOBILE_TABS: {
  id: Tab;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}[] = [
  {
    id: "quick",
    label: "よく使う",
    icon: (active) => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={active ? MG_GREEN : "#9a968f"} strokeWidth="2" strokeLinecap="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    id: "join",
    label: "参加する",
    icon: (active) => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={active ? MG_GREEN : "#9a968f"} strokeWidth="2" strokeLinecap="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    id: "organize",
    label: "主催・設定",
    icon: (active) => (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={active ? MG_GREEN : "#9a968f"} strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

function MobileChev() {
  return (
    <svg className="shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c5c2ba" strokeWidth="2" strokeLinecap="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

type MobileRowProps = {
  icon: React.ReactNode;
  title: string;
  sub: string;
  href: string;
  badge?: number;
};

function MobileRow({ icon, title, sub, href, badge }: MobileRowProps) {
  return (
    <Link
      href={href}
      className="flex min-h-[60px] items-center gap-3 border-b border-[#eceae3] bg-[#ffffff] px-4 py-3 transition-colors last:border-b-0 hover:bg-[#fafaf8]"
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: MG_GREEN_SOFT, color: MG_GREEN }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium text-[#18181a]">{title}</div>
        <div className="mt-0.5 truncate text-[11px] text-[#8c8a84]">{sub}</div>
      </div>
      {badge !== undefined && badge > 0 && (
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
          style={{ backgroundColor: MG_GREEN_SOFT, color: MG_GREEN }}
        >
          {badge}
        </span>
      )}
      <MobileChev />
    </Link>
  );
}

const LIST_CARD_CLASS =
  "w-full rounded-[12px] border border-[#DEDAD2] bg-white overflow-hidden";
const LIST_CARD_STYLE: React.CSSProperties = {
  boxShadow: "0 1px 3px rgba(0,0,0,.05),0 2px 8px rgba(0,0,0,.06)",
};

function SList({
  children,
  className,
  accentBorder,
}: {
  children: React.ReactNode;
  className?: string;
  accentBorder?: string;
}) {
  return (
    <div
      className={`${LIST_CARD_CLASS} ${className ?? ""}`}
      style={{
        ...LIST_CARD_STYLE,
        ...(accentBorder
          ? { borderLeftWidth: 3, borderLeftColor: accentBorder }
          : {}),
      }}
    >
      {children}
    </div>
  );
}

function SecLbl({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div
      className="mb-[6px] text-[10px] font-bold tracking-[.1em] uppercase"
      style={{ color: accent ?? "#8c8a84" }}
    >
      {children}
    </div>
  );
}

type SRowProps = {
  theme?: RowThemeKey;
  iconBg?: string;
  icon: React.ReactNode;
  title: string;
  sub: string;
  href: string;
  badge?: number;
  cta?: React.ReactNode;
};

function SRow({ theme, iconBg, icon, title, sub, href, badge, cta }: SRowProps) {
  const t = theme ? ROW_THEME[theme] : null;
  const resolvedIconBg = iconBg ?? t?.iconBg ?? "#F5F4EF";

  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 border-b border-[#ECEAE3] last:border-b-0 py-2.5 transition-colors ${
        t ? `pl-[9px] pr-3 ${ROW_LINK_HOVER}` : "px-3 hover:bg-[#F5F4EF]"
      }`}
      style={theme ? rowLinkStyle(theme) : undefined}
    >
      <div
        className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center shrink-0"
        style={{ background: resolvedIconBg }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="text-[13px] font-medium"
          style={{ color: t?.title ?? "#18181a" }}
        >
          {title}
        </div>
        <div className="text-[11px] text-[#8c8a84] mt-[1px] truncate">{sub}</div>
      </div>
      {badge !== undefined && (
        <span
          className="text-[12px] font-semibold px-[9px] py-[2px] rounded-[20px] min-w-[26px] text-center shrink-0"
          style={{
            color: t?.badgeColor ?? "#2B3A6B",
            backgroundColor: t?.badgeBg ?? "#eef2ff",
          }}
        >
          {badge}
        </span>
      )}
      {cta !== undefined ? cta : <Chev stroke={t?.chev} />}
    </Link>
  );
}

function MobileQuickItems({ unreadCount }: { unreadCount: number }) {
  const messageSub =
    unreadCount > 0
      ? `${unreadCount}件の未読メッセージがあります`
      : "未読メッセージはありません";

  return (
    <>
      <MobileRow
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        }
        title="メッセージ"
        sub={messageSub}
        href="/messages"
        badge={unreadCount}
      />
      <MobileRow
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </svg>
        }
        title="保存したイベント"
        sub="気になるイベントを一覧で確認できます"
        href="/saved"
      />
      <MobileRow
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
        }
        title="応募中のボランティア"
        sub="応募したボランティアの状況を確認できます"
        href="/volunteer"
      />
      <MobileRow
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v12M9 9h4.5a2 2 0 010 4H9" />
          </svg>
        }
        title="マイポイント"
        sub="保有ポイントと履歴を確認できます"
        href="/points"
      />
    </>
  );
}

function MobileJoinItems({
  plannedCount,
  savedCount,
  unreadCount,
}: {
  plannedCount: number;
  savedCount: number;
  unreadCount: number;
}) {
  return (
    <>
      <MobileRow
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        }
        title="参加予定のイベント"
        sub="「参加予定にする」を押すと表示されます"
        href="/profile/events/planned"
        badge={plannedCount}
      />
      <MobileRow
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          </svg>
        }
        title="あとで見るイベント"
        sub="保存したイベント一覧"
        href="/saved"
        badge={savedCount}
      />
      <MobileRow
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        }
        title="未読メッセージ"
        sub="主催者・参加者とのやりとり"
        href="/messages"
        badge={unreadCount}
      />
      <Link
        href="/"
        className="flex min-h-[60px] items-center gap-3 border-b border-[#eceae3] bg-[#ffffff] px-4 py-3 transition-colors last:border-b-0 hover:bg-[#fafaf8]"
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: MG_GREEN_SOFT, color: MG_GREEN }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-[#18181a]">イベントを探す</div>
          <div className="mt-0.5 truncate text-[11px] text-[#8c8a84]">地域のイベントを検索・一覧で見る</div>
        </div>
        <span
          className="shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold text-white"
          style={{ backgroundColor: MG_GREEN }}
        >
          探す
        </span>
      </Link>
    </>
  );
}

function SettingsSection() {
  const t = SECTION_THEME.settings;
  return (
    <div>
      <SecLbl accent={t.label}>設定</SecLbl>
      <SList accentBorder={t.border}>
        <SRow
          theme="purple"
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={ROW_THEME.purple.iconStroke} strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
          title="プロフィール設定"
          sub="自己紹介・アイコン・基本情報"
          href="/profile/edit"
        />
        <SRow
          theme="purple"
          iconBg="#EDE9FE"
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>}
          title="通知設定"
          sub="メッセージ / イベント更新の通知"
          href="/profile/settings"
        />
      </SList>
    </div>
  );
}

function OrganizerSection({
  isOrganizerRegistered,
}: {
  isOrganizerRegistered: boolean;
}) {
  const t = SECTION_THEME.organize;
  return (
    <div>
      <SecLbl accent={t.label}>主催</SecLbl>
      {isOrganizerRegistered ? (
        <SList accentBorder={t.border}>
          <SRow
            theme="orange"
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={ROW_THEME.orange.iconStroke} strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>}
            title="主催ダッシュボード"
            sub="作成中のイベント・募集・応募状況"
            href="/organizer"
          />
          <SRow
            theme="orange"
            iconBg="#FEEBC8"
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DD6B20" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg>}
            title="イベントを作成"
            sub="新規イベントを登録する"
            href="/organizer/events/new"
          />
          <SRow
            theme="orange"
            iconBg="#FED7AA"
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C05621" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>}
            title="募集を作成"
            sub="ボランティアやスタッフを募集する"
            href="/organizer/recruitments/new"
          />
        </SList>
      ) : (
        <Link
          href="/organizer/register"
          className="block rounded-[12px] border bg-white px-[16px] py-[13px] hover:bg-[#F7F6F2] transition-colors"
          style={{ borderWidth: 1, borderLeftWidth: 4, borderColor: "#DEDAD2", borderLeftColor: "#ED8936", boxShadow: "0 1px 3px rgba(0,0,0,.05),0 2px 8px rgba(0,0,0,.06)" }}
        >
          <div className="text-[11px] font-medium text-[#8c8a84] mb-[4px]">個人でもOK</div>
          <div className="text-[13px] font-semibold text-[#18181a]">主催登録をはじめる</div>
          <div className="text-[11px] text-[#52504c] mt-[2px]">個人でも団体でも、イベント作成や募集管理を始められます。</div>
          <div className="text-[12px] font-medium text-[#ED8936] mt-[6px]">登録に進む →</div>
        </Link>
      )}
    </div>
  );
}

function ProfileContent() {
  const { user, loading: authLoading } = useSupabaseUser();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("quick");
  const [profile, setProfile] = useState({
    displayName: "",
    avatarUrl: null as string | null,
    bio: null as string | null,
    region: null as string | null,
    isOrganizerRegistered: false,
  });
  const [plannedCount, setPlannedCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [noSupabase] = useState(() => createClient() === null);
  const unreadCount = useUnreadCount(!!user);

  useEffect(() => {
    if (!user) {
      setSummaryLoading(false);
      return;
    }

    setProfile((prev) => ({
      ...prev,
      displayName: prev.displayName || fallbackDisplayName(user),
    }));
    setSummaryLoading(true);

    let cancelled = false;
    prefetchMypageSummary()
      .then((data: MypageSummaryResponse | null) => {
        if (cancelled || !data?.profile) return;
        setProfile(data.profile);
        setPlannedCount(data.counts?.planned ?? 0);
        setSavedCount(data.counts?.interested ?? 0);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSummaryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleLogout = async () => {
    resetMypageSummaryPrefetch();
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    router.push("/");
  };

  if (authLoading) return <ProfilePageSkeleton />;

  const displayName =
    profile.displayName || (user ? fallbackDisplayName(user) : "ゲスト");

  return (
    <div className="mg-profile-mobile-page max-[899px]:overflow-x-hidden min-[900px]:flex min-[900px]:min-h-0 min-[900px]:flex-1 min-[900px]:flex-col min-[900px]:bg-[#F7F8F5]">
      {noSupabase && (
        <div className="px-4 pt-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            <p className="font-medium">プロフィールの保存には Supabase の設定が必要です。</p>
            <div className="mt-3">
              <SupabaseSetupGuide backHref="/" backLabel="← トップへ" />
            </div>
          </div>
        </div>
      )}

      {!user && !noSupabase && (
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#DEDAD2] bg-white px-6 py-8 text-center" style={{ boxShadow: "0 4px 16px rgba(0,0,0,.08)" }}>
            <p className="text-[#52504c]">ログインするとプロフィールや参加予定を確認できます。</p>
            <Link
              href="/auth?next=/profile"
              className="mt-4 inline-block rounded-xl bg-[#2F8F57] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              ログインはこちら
            </Link>
          </div>
        </div>
      )}

      {user && (
        <>
          {/* ── Mobile（ヘッダーと同じ max-w-screen-sm・同一 px で幅を揃える） */}
          <div className="mx-auto flex w-full max-w-screen-sm flex-col gap-3 px-4 pt-1.5 pb-6 min-[900px]:hidden">
            <MypageMobileProfileCard
              displayName={displayName}
              avatarUrl={profile.avatarUrl}
              bio={profile.bio}
              region={profile.region}
              stats={{
                participated: plannedCount,
                volunteer: 0,
                favorites: savedCount,
                points: 0,
              }}
              onLogout={handleLogout}
            />

            <div
              className="relative z-[1] overflow-hidden rounded-2xl border border-[#e8e6e0] bg-[#ffffff]"
              style={{ backgroundColor: "#ffffff", boxShadow: "0 2px 12px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.04)" }}
            >
              <div className="flex border-b border-[#eceae3] bg-[#ffffff]" role="tablist">
                {MOBILE_TABS.map(({ id, label, icon }) => {
                  const isActive = tab === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setTab(id)}
                      className={`relative flex flex-1 flex-col items-center gap-1 border-b-[3px] px-1 py-3 text-[11px] font-semibold transition-colors ${
                        isActive ? "text-[#3d8a5c]" : "text-[#9a968f] hover:bg-[#fafaf8]"
                      }`}
                      style={{ borderBottomColor: isActive ? MG_GREEN : "transparent" }}
                    >
                      {icon(isActive)}
                      {label}
                    </button>
                  );
                })}
              </div>

              {tab === "quick" && (
                <div className="bg-[#ffffff]">
                  <MobileQuickItems unreadCount={unreadCount} />
                </div>
              )}
              {tab === "join" && (
                <div className="bg-[#ffffff]">
                  <MobileJoinItems
                    plannedCount={plannedCount}
                    savedCount={savedCount}
                    unreadCount={unreadCount}
                  />
                </div>
              )}
              {tab === "organize" && (
                <div className="flex flex-col gap-3 bg-[#ffffff] p-3">
                  <OrganizerSection isOrganizerRegistered={profile.isOrganizerRegistered} />
                  <SettingsSection />
                </div>
              )}
            </div>

            <MypageMobileFooterLinks />
          </div>

          {/* ── PC ── */}
          <MypagePcView
            displayName={displayName}
            avatarUrl={profile.avatarUrl}
            bio={profile.bio}
            stats={{
              participated: plannedCount,
              volunteer: 0,
              favorites: savedCount,
              points: 0,
            }}
            plannedCount={plannedCount}
            savedCount={savedCount}
            unreadCount={unreadCount}
            isOrganizerRegistered={profile.isOrganizerRegistered}
            summaryLoading={summaryLoading}
            onLogout={handleLogout}
          />
        </>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfilePageSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}
