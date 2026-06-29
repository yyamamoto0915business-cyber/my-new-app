"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { syncSupabaseSessionFromServerWithRetries } from "@/lib/supabase/sync-session-from-server";
import { useSupabaseUser } from "@/hooks/use-supabase-user";
import { useRouter } from "next/navigation";
import { SupabaseSetupGuide } from "@/components/supabase-setup-guide";
import { useUnreadCount } from "@/hooks/use-unread-count";
import type { User } from "@supabase/supabase-js";
import { ProfilePageSkeleton } from "@/components/profile/ProfilePageSkeleton";
import {
  buildProfileInitials,
  normalizeProfileAvatarRole,
  resolveAvatarUrlByRole,
} from "@/lib/profile-avatar";

type Tab = "quick" | "join" | "organize";

/** マイページタブの色 */
const PROFILE_TABS: { id: Tab; label: string; color: string; bg: string; border: string }[] = [
  { id: "quick", label: "よく使う", color: "#2B6CB0", bg: "#EBF8FF", border: "#4299E1" },
  { id: "join", label: "参加する", color: "#276749", bg: "#F0FFF4", border: "#48BB78" },
  { id: "organize", label: "主催・設定", color: "#C05621", bg: "#FFFAF0", border: "#ED8936" },
];

/** セクション見出し・アイコン・カード左線の色 */
const SECTION_THEME = {
  organize: { label: "#C05621", iconBg: "#FFFAF0", iconStroke: "#DD6B20", border: "#ED8936" },
  settings: { label: "#6B46C1", iconBg: "#FAF5FF", iconStroke: "#805AD5", border: "#9F7AEA" },
  join: { label: "#276749", iconBg: "#F0FFF4", iconStroke: "#38A169", border: "#48BB78" },
  quick: { label: "#2C5282", iconBg: "#EBF8FF", iconStroke: "#4299E1", border: "#4299E1" },
} as const;

/** リスト行ごとの色（背景ティント・左線・アイコン・件数） */
const ROW_THEME = {
  navy: {
    rowBg: "#EBF8FF",
    rowHover: "#E6FFFA",
    accent: "#4299E1",
    iconBg: "#EBF8FF",
    iconStroke: "#3182CE",
    title: "#2B6CB0",
    badgeBg: "#EBF8FF",
    badgeColor: "#2B6CB0",
    chev: "#90CDF4",
  },
  green: {
    rowBg: "#F0FFF4",
    rowHover: "#E6FFED",
    accent: "#48BB78",
    iconBg: "#F0FFF4",
    iconStroke: "#38A169",
    title: "#276749",
    badgeBg: "#F0FFF4",
    badgeColor: "#276749",
    chev: "#9AE6B4",
  },
  gold: {
    rowBg: "#FFFAF0",
    rowHover: "#FEF3C7",
    accent: "#ED8936",
    iconBg: "#FFFAF0",
    iconStroke: "#DD6B20",
    title: "#C05621",
    badgeBg: "#FFFAF0",
    badgeColor: "#C05621",
    chev: "#FBD38D",
  },
  rose: {
    rowBg: "#FFF5F7",
    rowHover: "#FED7E2",
    accent: "#ED64A6",
    iconBg: "#FFF5F7",
    iconStroke: "#D53F8C",
    title: "#B83280",
    badgeBg: "#FFF5F7",
    badgeColor: "#B83280",
    chev: "#FBB6CE",
  },
  sky: {
    rowBg: "#EBF8FF",
    rowHover: "#E6FFFA",
    accent: "#4299E1",
    iconBg: "#EBF8FF",
    iconStroke: "#3182CE",
    title: "#2B6CB0",
    badgeBg: "#EBF8FF",
    badgeColor: "#2B6CB0",
    chev: "#90CDF4",
  },
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

function profileTabStyle(id: Tab, active: boolean): React.CSSProperties {
  const t = PROFILE_TABS.find((x) => x.id === id)!;
  if (active) {
    return {
      color: t.color,
      backgroundColor: t.bg,
      borderBottomColor: t.border,
    };
  }
  return {
    color: "#9a968f",
    backgroundColor: "transparent",
    borderBottomColor: "transparent",
  };
}

function isMissingAvatarColumnsError(msg: string) {
  return /participant_avatar_url|organizer_avatar_url|active_profile_role|42703/i.test(msg);
}

function Chev({ stroke = "#DEDAD2" }: { stroke?: string }) {
  return (
    <svg className="shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

/** バナー用アバター（固定サイズ・任意URLの img で表示） */
function ProfileBannerAvatar({
  avatarUrl,
  displayName,
}: {
  avatarUrl: string | null;
  displayName: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = avatarUrl && !failed;

  if (showImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- 外部URLもそのまま表示
      <img
        src={avatarUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        decoding="async"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className="absolute inset-0 flex items-center justify-center bg-[#2C5282] text-[11px] font-bold text-white/90">
      {buildProfileInitials(displayName)}
    </span>
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
  fill,
}: {
  children: React.ReactNode;
  className?: string;
  accentBorder?: string;
  /** PC: カラム高さいっぱいに伸ばす */
  fill?: boolean;
}) {
  return (
    <div
      className={`${LIST_CARD_CLASS} ${fill ? "flex min-h-0 flex-1 flex-col" : ""} ${className ?? ""}`}
      style={{
        ...LIST_CARD_STYLE,
        ...(accentBorder
          ? { borderLeftWidth: 3, borderLeftColor: accentBorder }
          : {}),
      }}
    >
      {fill ? <div className="flex min-h-0 flex-1 flex-col">{children}</div> : children}
    </div>
  );
}

function SecLbl({
  children,
  accent,
  pc,
}: {
  children: React.ReactNode;
  accent?: string;
  pc?: boolean;
}) {
  return (
    <div
      className={
        pc
          ? "mb-2.5 truncate text-[13px] font-bold whitespace-nowrap text-[#3d3b36]"
          : "mb-[6px] text-[10px] font-bold tracking-[.1em] uppercase"
      }
      style={pc ? undefined : { color: accent ?? "#8c8a84" }}
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
  /** PC: 行を均等に伸ばす */
  fill?: boolean;
};

/** PC: カラム内リスト行（1カラム＝1枚の白カード） */
function PcListRow({
  theme,
  iconBg,
  icon,
  title,
  sub,
  href,
  count,
}: {
  theme: RowThemeKey;
  iconBg?: string;
  icon: React.ReactNode;
  title: string;
  sub: string;
  href: string;
  count?: number;
}) {
  const t = ROW_THEME[theme];
  return (
    <Link
      href={href}
      className="flex items-center gap-2 border-b border-[#EDF2F7] py-3 pr-3 pl-2 transition-colors last:border-b-0 hover:bg-[#FAFAF8]"
      style={{
        borderLeftWidth: 4,
        borderLeftColor: t.accent,
        ["--row-hover-bg" as string]: t.rowHover,
      }}
    >
      <div
        className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{ background: iconBg ?? t.iconBg }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="truncate text-[13px] font-semibold whitespace-nowrap text-[#18181a]">
          {title}
        </div>
        <div className="mt-0.5 truncate text-[11px] whitespace-nowrap text-[#8c8a84]">{sub}</div>
      </div>
      {count !== undefined && (
        <span
          className="shrink-0 text-[18px] font-light leading-none tabular-nums"
          style={{ color: t.title }}
        >
          {count}
        </span>
      )}
      <Chev stroke="#C5C2BA" />
    </Link>
  );
}

const PC_LIST_CARD_CLASS =
  "w-full overflow-hidden rounded-[14px] border border-[#E8E6E0] bg-white";
const PC_LIST_CARD_STYLE: React.CSSProperties = {
  boxShadow: "0 1px 4px rgba(0,0,0,.04),0 2px 10px rgba(0,0,0,.05)",
};

function PcListCard({
  children,
  className,
  fill,
}: {
  children: React.ReactNode;
  className?: string;
  fill?: boolean;
}) {
  return (
    <div
      className={`${PC_LIST_CARD_CLASS} ${fill ? "flex min-h-0 flex-1 flex-col" : ""} ${className ?? ""}`}
      style={PC_LIST_CARD_STYLE}
    >
      {fill ? <div className="flex min-h-0 flex-1 flex-col">{children}</div> : children}
    </div>
  );
}

function SRow({ theme, iconBg, icon, title, sub, href, badge, cta, fill }: SRowProps) {
  const t = theme ? ROW_THEME[theme] : null;
  const resolvedIconBg = iconBg ?? t?.iconBg ?? "#F5F4EF";

  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 border-b border-[#ECEAE3] last:border-b-0 transition-colors ${
        fill ? "min-h-[52px] flex-1 py-3" : "py-2.5"
      } ${
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

function QuickItems({
  sz = 15,
  bare = false,
  fill = false,
}: {
  sz?: number;
  bare?: boolean;
  fill?: boolean;
}) {
  const rows = (
    <>
      <SRow
        fill={fill}
        theme="navy"
        icon={<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={ROW_THEME.navy.iconStroke} strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>}
        title="メッセージ"
        sub="未読件数・やりとり状況"
        href="/messages"
      />
      <SRow
        fill={fill}
        theme="green"
        icon={<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={ROW_THEME.green.iconStroke} strokeWidth="2" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>}
        title="保存したイベント"
        sub="気になるイベント一覧へ"
        href="/saved"
      />
      <SRow
        fill={fill}
        theme="gold"
        icon={<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={ROW_THEME.gold.iconStroke} strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>}
        title="応募中のボランティア"
        sub="応募状況・参加予定へ"
        href="/volunteer"
      />
      <SRow
        fill={fill}
        theme="rose"
        icon={<svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={ROW_THEME.rose.iconStroke} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
        title="マイポイント"
        sub="保有ポイントと履歴確認"
        href="/points"
      />
    </>
  );
  return bare ? rows : <SList fill={fill}>{rows}</SList>;
}

function SettingsSection({ fill = false }: { fill?: boolean }) {
  const t = SECTION_THEME.settings;
  return (
    <div className={fill ? "flex min-h-0 flex-[2] flex-col" : undefined}>
      <SecLbl accent={t.label}>設定</SecLbl>
      <SList accentBorder={t.border} fill={fill}>
        <SRow
          fill={fill}
          theme="purple"
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={ROW_THEME.purple.iconStroke} strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
          title="プロフィール設定"
          sub="自己紹介・アイコン・基本情報"
          href="/profile/edit"
        />
        <SRow
          fill={fill}
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
  fill = false,
}: {
  isOrganizerRegistered: boolean;
  fill?: boolean;
}) {
  const t = SECTION_THEME.organize;
  return (
    <div className={fill ? "flex min-h-0 flex-[3] flex-col" : undefined}>
      <SecLbl accent={t.label}>主催</SecLbl>
      {isOrganizerRegistered ? (
        <SList accentBorder={t.border} fill={fill}>
          <SRow
            fill={fill}
            theme="orange"
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={ROW_THEME.orange.iconStroke} strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>}
            title="主催ダッシュボード"
            sub="作成中のイベント・募集・応募状況"
            href="/organizer"
          />
          <SRow
            fill={fill}
            theme="orange"
            iconBg="#FEEBC8"
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DD6B20" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg>}
            title="イベントを作成"
            sub="新規イベントを登録する"
            href="/organizer/events/new"
          />
          <SRow
            fill={fill}
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

function JoinItems({
  plannedCount,
  savedCount,
  unreadCount,
  bare = false,
}: {
  plannedCount: number;
  savedCount: number;
  unreadCount: number;
  bare?: boolean;
}) {
  const rows = (
    <>
      <SRow
        theme="green"
        icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={ROW_THEME.green.iconStroke} strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
        title="参加予定のイベント"
        sub="「参加予定にする」を押すと表示されます"
        href="/profile/events/planned"
        badge={plannedCount}
      />
      <SRow
        theme="gold"
        icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={ROW_THEME.gold.iconStroke} strokeWidth="2" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>}
        title="あとで見るイベント"
        sub="保存したイベント一覧"
        href="/saved"
        badge={savedCount}
      />
      <SRow
        theme="rose"
        icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={ROW_THEME.rose.iconStroke} strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>}
        title="未読メッセージ"
        sub="主催者・参加者とのやりとり"
        href="/messages"
        badge={unreadCount}
      />
      <Link
        href="/"
        className={`flex items-center gap-2.5 py-2.5 pl-[9px] pr-3 ${ROW_LINK_HOVER}`}
        style={rowLinkStyle("green")}
      >
        <div
          className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center shrink-0"
          style={{ background: ROW_THEME.green.iconBg }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={ROW_THEME.green.iconStroke} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium" style={{ color: ROW_THEME.green.title }}>イベントを探す</div>
          <div className="text-[11px] text-[#8c8a84] mt-[1px]">地域のイベントを検索・一覧で見る</div>
        </div>
        <span className="px-[12px] py-[5px] rounded-[7px] bg-[#48BB78] text-[11px] font-semibold text-white shrink-0">探す →</span>
      </Link>
    </>
  );
  return bare ? rows : <SList accentBorder={SECTION_THEME.join.border}>{rows}</SList>;
}

const BANNER_BORDER_STYLE: React.CSSProperties = {
  background: "linear-gradient(90deg,#c8a84b 0%,#f5e07a 25%,#fffce4 50%,#f5e07a 75%,#c8a84b 100%)",
  backgroundSize: "200%",
  animation: "mg-bgs 3.5s linear infinite",
  boxShadow: "0 2px 12px rgba(200,168,75,.2)",
};

const BANNER_INNER_STYLE: React.CSSProperties = {
  background: "linear-gradient(105deg,#1A365D 0%,#2C5282 48%,#38B2AC 100%)",
};

const BANNER_PC_STYLE: React.CSSProperties = {
  background: "linear-gradient(105deg,#1A365D 0%,#2C5282 45%,#38B2AC 100%)",
  boxShadow: "0 4px 20px rgba(26,54,93,.18)",
};

/** バナー上ボタン（グラデ背景でも読みやすく） */
const BANNER_BTN_PRIMARY: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.65)",
  background: "rgba(255,255,255,.28)",
  color: "#ffffff",
  boxShadow: "0 1px 4px rgba(0,0,0,.2)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  textShadow: "0 1px 2px rgba(0,0,0,.2)",
};

const BANNER_BTN_SECONDARY: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.5)",
  background: "rgba(0,0,0,.18)",
  color: "#ffffff",
  boxShadow: "0 1px 4px rgba(0,0,0,.15)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  textShadow: "0 1px 2px rgba(0,0,0,.2)",
};

const BANNER_PATTERN_STYLE: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundImage: "radial-gradient(circle,rgba(255,255,255,.04) 1px,transparent 1px)",
  backgroundSize: "20px 20px",
  pointerEvents: "none",
};

const BANNER_SHINE_STYLE: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "linear-gradient(115deg,rgba(255,255,255,.05) 0%,transparent 55%)",
  pointerEvents: "none",
};

function ProfileContent() {
  const { user, loading: authLoading } = useSupabaseUser();
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const effectiveUser = user ?? sessionUser;
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("quick");
  const [profile, setProfile] = useState({
    displayName: "",
    avatarUrl: null as string | null,
    isOrganizerRegistered: false,
  });
  const [plannedCount, setPlannedCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [noSupabase, setNoSupabase] = useState(false);
  const unreadCount = useUnreadCount(!!effectiveUser);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setNoSupabase(true);
      setSessionUser(null);
      setLoading(false);
      return;
    }
    (async () => {
      try {
        let authUser = (await supabase.auth.getUser()).data.user ?? null;
        if (!authUser && user) authUser = user;
        if (!authUser) {
          await syncSupabaseSessionFromServerWithRetries(supabase);
          authUser = (await supabase.auth.getUser()).data.user ?? null;
        }
        if (!authUser && user) authUser = user;
        setSessionUser(authUser);
        if (!authUser) { setLoading(false); return; }

        const fallbackName =
          (authUser.user_metadata?.display_name as string) ??
          (authUser.user_metadata?.name as string) ??
          authUser.email?.split("@")[0] ?? "";

        const [{ data: organizerRow }, { data: profileData, error: profileError }] =
          await Promise.all([
            supabase.from("organizers").select("id").eq("profile_id", authUser.id).maybeSingle(),
            supabase
              .from("profiles")
              .select("display_name, avatar_url, participant_avatar_url, organizer_avatar_url, active_profile_role")
              .eq("id", authUser.id)
              .single(),
          ]);

        let avatarUrl: string | null = null;
        let displayName = fallbackName;

        if (profileError && isMissingAvatarColumnsError(profileError.message ?? "")) {
          const { data: leg } = await supabase
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("id", authUser.id)
            .single();
          if (leg) {
            displayName = leg.display_name ?? fallbackName;
            avatarUrl = leg.avatar_url ?? null;
          }
        } else if (profileData) {
          displayName = profileData.display_name ?? fallbackName;
          avatarUrl = resolveAvatarUrlByRole(
            {
              avatar_url: profileData.avatar_url,
              participant_avatar_url: profileData.participant_avatar_url,
              organizer_avatar_url: profileData.organizer_avatar_url,
              active_profile_role: normalizeProfileAvatarRole(profileData.active_profile_role),
            },
            "participant"
          );
        }

        setProfile({
          displayName: displayName || "ゲスト",
          avatarUrl,
          isOrganizerRegistered: !!organizerRow,
        });
      } catch {
        setSessionUser(null);
        setProfile({ displayName: "ゲスト", avatarUrl: null, isOrganizerRegistered: false });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!effectiveUser) return;
    fetch("/api/me/event-reactions")
      .then((r) => r.json())
      .then((d: { planned?: unknown[]; interested?: unknown[] }) => {
        setPlannedCount(Array.isArray(d.planned) ? d.planned.length : 0);
        setSavedCount(Array.isArray(d.interested) ? d.interested.length : 0);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUser?.id]);

  const handleLogout = async () => {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    router.push("/");
  };

  if (authLoading || loading) return <ProfilePageSkeleton />;

  const avatarSmEl = (
    <ProfileBannerAvatar
      avatarUrl={profile.avatarUrl}
      displayName={profile.displayName}
    />
  );

  return (
    <div className="bg-[#EDECE7] max-[899px]:overflow-x-hidden min-[900px]:flex min-[900px]:min-h-0 min-[900px]:flex-1 min-[900px]:flex-col min-[900px]:bg-[#F7FAFC]">
      <style>{`@keyframes mg-bgs { from { background-position: -200% center; } to { background-position: 200% center; } }`}</style>

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

      {!effectiveUser && !noSupabase && (
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#DEDAD2] bg-white px-6 py-8 text-center" style={{ boxShadow: "0 4px 16px rgba(0,0,0,.08)" }}>
            <p className="text-[#52504c]">ログインするとプロフィールや参加予定を確認できます。</p>
            <Link
              href="/auth?next=/profile"
              className="mt-4 inline-block rounded-xl bg-[#2C5282] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              ログインはこちら
            </Link>
          </div>
        </div>
      )}

      {effectiveUser && (
        <>
          {/* ── Mobile（ヘッダーと同じ max-w-screen-sm・同一 px で幅を揃える） */}
          <div className="mx-auto flex w-full max-w-screen-sm flex-col gap-2 px-4 pt-1.5 pb-4 min-[900px]:hidden">
            {/* Banner */}
            <div className="w-full rounded-[12px] p-[2px]" style={BANNER_BORDER_STYLE}>
              <div className="rounded-[10px] overflow-hidden relative" style={BANNER_INNER_STYLE}>
                <div style={BANNER_PATTERN_STYLE} />
                <div style={BANNER_SHINE_STYLE} />
                <svg
                  style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 96, opacity: 0.22, pointerEvents: "none" }}
                  viewBox="0 0 110 80"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="xMaxYMin meet"
                >
                  <ellipse cx="84" cy="68" rx="6" ry="16" fill="#2d5a2d" opacity=".85" />
                  <ellipse cx="80" cy="50" rx="32" ry="17" fill="#2d6e3a" opacity=".82" />
                  <ellipse cx="76" cy="34" rx="24" ry="14" fill="#357a40" opacity=".78" />
                  <ellipse cx="72" cy="20" rx="17" ry="11" fill="#3d8a48" opacity=".72" />
                  <circle cx="32" cy="18" r="16" fill="rgba(255,255,255,.04)" />
                </svg>
                <div className="flex min-h-0 items-center gap-2.5 px-3 py-2.5 relative z-[1]">
                  <Link href="/profile/edit" className="relative shrink-0" aria-label="プロフィールを編集">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full" style={{ border: "2px solid rgba(255,255,255,.4)", boxShadow: "0 0 10px rgba(56,178,172,.25)" }}>
                      {avatarSmEl}
                    </div>
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#48BB78]" style={{ border: "2px solid #1A365D" }} />
                  </Link>
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="text-[8px] tracking-[.16em] font-semibold mb-0.5" style={{ color: "rgba(144,205,244,.9)" }}>MYPAGE</div>
                    <div className="text-base font-normal text-white leading-tight truncate" style={{ fontFamily: "'Noto Serif JP', serif" }}>
                      {profile.displayName}
                    </div>
                    <div className="text-[10px] mt-0.5 line-clamp-1 font-medium" style={{ color: "rgba(255,255,255,.82)" }}>地域のイベントに参加してみよう</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Link
                      href="/profile/edit"
                      className="rounded-[14px] px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition-colors hover:bg-white/35"
                      style={BANNER_BTN_PRIMARY}
                    >
                      編集
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="cursor-pointer rounded-[14px] px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition-colors hover:bg-black/25"
                      style={BANNER_BTN_SECONDARY}
                    >
                      ログアウト
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* タブ + リスト（1枚のカード・sticky なしで重なり防止） */}
            <div className={LIST_CARD_CLASS} style={LIST_CARD_STYLE}>
              <div className="flex border-b border-[#DEDAD2] bg-[#FAFAF8]" role="tablist">
                {PROFILE_TABS.map(({ id, label, border }) => {
                  const isActive = tab === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setTab(id)}
                      className={`relative flex-1 border-b-[3px] py-2.5 text-center text-[11px] font-semibold transition-colors cursor-pointer -mb-px ${
                        isActive ? "" : "hover:bg-white/70"
                      }`}
                      style={profileTabStyle(id, isActive)}
                    >
                      <span
                        className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle"
                        style={{ backgroundColor: border, opacity: isActive ? 1 : 0.45 }}
                        aria-hidden
                      />
                      {label}
                    </button>
                  );
                })}
              </div>

              {tab === "quick" && <QuickItems sz={15} bare />}
              {tab === "join" && (
                <JoinItems
                  bare
                  plannedCount={plannedCount}
                  savedCount={savedCount}
                  unreadCount={unreadCount}
                />
              )}
              {tab === "organize" && (
                <div className="flex flex-col gap-3 p-3">
                  <OrganizerSection isOrganizerRegistered={profile.isOrganizerRegistered} />
                  <SettingsSection />
                </div>
              )}
            </div>
          </div>

          {/* ── PC（4カラム・カード単位） ── */}
          <div className="hidden min-h-0 min-[900px]:flex min-[900px]:flex-1 min-[900px]:flex-col min-[900px]:bg-[#F7FAFC]">
            {/* Banner */}
            <div className="relative mx-6 mt-4 shrink-0 overflow-hidden rounded-[16px]" style={BANNER_PC_STYLE}>
              <div style={{ ...BANNER_PATTERN_STYLE, backgroundSize: "22px 22px" }} />
              <div style={{ ...BANNER_SHINE_STYLE, background: "linear-gradient(108deg,rgba(255,255,255,.08) 0%,transparent 55%)" }} />
              <div className="relative z-[1] flex items-center gap-4 px-6 py-5">
                  <div className="relative shrink-0">
                    <div
                      className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full"
                      style={{ border: "3px solid rgba(255,255,255,.35)", boxShadow: "0 0 16px rgba(56,178,172,.35)" }}
                    >
                      {avatarSmEl}
                    </div>
                    <div className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#48BB78]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[22px] font-normal leading-tight text-white"
                      style={{ fontFamily: "'Noto Serif JP', serif" }}
                    >
                      {profile.displayName}
                    </div>
                    <div className="mt-1 text-[13px] font-medium" style={{ color: "rgba(255,255,255,.82)" }}>
                      地域のイベントに参加してみよう
                    </div>
                  </div>
                  <div className="ml-auto flex shrink-0 items-center gap-2">
                    <Link
                      href="/profile/edit"
                      className="flex items-center gap-1.5 rounded-[20px] px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap transition-colors hover:bg-white/35"
                      style={BANNER_BTN_PRIMARY}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      プロフィール編集
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex cursor-pointer items-center gap-1.5 rounded-[20px] px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap transition-colors hover:bg-black/25"
                      style={BANNER_BTN_SECONDARY}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      ログアウト
                    </button>
                  </div>
                </div>
            </div>

            {/* 4-column grid（各カラム＝見出し + 1枚の白カード） */}
            <div className="grid min-h-0 flex-1 grid-cols-4 items-stretch gap-3 px-5 pb-6 pt-4">
              {/* よく使う */}
              <div className="flex min-w-0 flex-col">
                <SecLbl pc>よく使う</SecLbl>
                <PcListCard>
                  <PcListRow
                    theme="navy"
                    icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={ROW_THEME.navy.iconStroke} strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>}
                    title="メッセージ"
                    sub="未読件数・やりとり状況"
                    href="/messages"
                  />
                  <PcListRow
                    theme="green"
                    icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={ROW_THEME.green.iconStroke} strokeWidth="2" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>}
                    title="保存したイベント"
                    sub="気になるイベント一覧へ"
                    href="/saved"
                  />
                  <PcListRow
                    theme="gold"
                    icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={ROW_THEME.gold.iconStroke} strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>}
                    title="応募中のボランティア"
                    sub="応募状況・参加予定へ"
                    href="/volunteer"
                  />
                  <PcListRow
                    theme="rose"
                    icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={ROW_THEME.rose.iconStroke} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
                    title="マイポイント"
                    sub="保有ポイントと履歴確認"
                    href="/points"
                  />
                </PcListCard>
              </div>

              {/* 設定 */}
              <div className="flex min-w-0 flex-col">
                <SecLbl pc>設定</SecLbl>
                <PcListCard>
                  <PcListRow
                    theme="purple"
                    icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={ROW_THEME.purple.iconStroke} strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                    title="プロフィール設定"
                    sub="自己紹介・アイコン・基本情報"
                    href="/profile/edit"
                  />
                  <PcListRow
                    theme="purple"
                    iconBg="#EDE9FE"
                    icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>}
                    title="通知設定"
                    sub="メッセージ / イベント更新の通知"
                    href="/profile/settings"
                  />
                </PcListCard>
              </div>

              {/* 主催 */}
              <div className="flex min-w-0 flex-col">
                <SecLbl pc>主催</SecLbl>
                {profile.isOrganizerRegistered ? (
                  <PcListCard>
                    <PcListRow
                      theme="orange"
                      icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={ROW_THEME.orange.iconStroke} strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>}
                      title="主催ダッシュボード"
                      sub="作成中のイベント・募集・応募状況"
                      href="/organizer"
                    />
                    <PcListRow
                      theme="orange"
                      iconBg="#FEEBC8"
                      icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#DD6B20" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg>}
                      title="イベントを作成"
                      sub="新規イベントを登録する"
                      href="/organizer/events/new"
                    />
                    <PcListRow
                      theme="orange"
                      iconBg="#FED7AA"
                      icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#C05621" strokeWidth="2" strokeLinecap="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>}
                      title="募集を作成"
                      sub="ボランティアやスタッフを募集する"
                      href="/organizer/recruitments/new"
                    />
                  </PcListCard>
                ) : (
                  <PcListCard>
                    <Link
                      href="/organizer/register"
                      className="block px-4 py-4 transition-colors hover:bg-[#FAFAF8]"
                    >
                      <div className="text-[11px] font-medium text-[#8c8a84]">個人でもOK</div>
                      <div className="mt-1 text-[13px] font-semibold text-[#18181a]">主催登録をはじめる</div>
                      <div className="mt-0.5 text-[11px] text-[#52504c]">イベント作成や募集管理を始められます</div>
                      <div className="mt-2 text-[12px] font-medium text-[#48BB78]">登録に進む →</div>
                    </Link>
                  </PcListCard>
                )}
              </div>

              {/* 参加する */}
              <div className="flex min-w-0 flex-col">
                <SecLbl pc>参加する</SecLbl>
                <PcListCard>
                  <PcListRow
                    theme="green"
                    icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={ROW_THEME.green.iconStroke} strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
                    title="参加予定のイベント"
                    sub="参加予定にしたイベント一覧"
                    href="/profile/events/planned"
                    count={plannedCount}
                  />
                  <PcListRow
                    theme="gold"
                    icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={ROW_THEME.gold.iconStroke} strokeWidth="2" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>}
                    title="あとで見るイベント"
                    sub="保存したイベント一覧"
                    href="/saved"
                    count={savedCount}
                  />
                  <PcListRow
                    theme="rose"
                    icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={ROW_THEME.rose.iconStroke} strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>}
                    title="未読メッセージ"
                    sub="主催者・参加者とのやりとり"
                    href="/messages"
                    count={unreadCount}
                  />
                  <div className="flex shrink-0 flex-col gap-2 border-t border-[#ECEAE3] p-2.5">
                    <Link
                      href="/"
                      className="flex w-full items-center justify-center gap-1.5 rounded-[10px] bg-[#48BB78] px-2 py-2.5 text-[12px] font-semibold whitespace-nowrap text-white transition-opacity hover:bg-[#38A169]"
                    >
                      <svg className="shrink-0" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      イベントを探す
                    </Link>
                    <Link
                      href="/messages"
                      className="flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-[#DEDAD2] bg-white px-2 py-2.5 text-[12px] font-medium whitespace-nowrap text-[#3d3b36] transition-colors hover:bg-[#FAFAF8]"
                    >
                      <svg className="shrink-0" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                      メッセージ
                    </Link>
                  </div>
                </PcListCard>
              </div>
            </div>
          </div>
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
