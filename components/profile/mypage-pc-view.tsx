"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Bell,
  Bookmark,
  CalendarDays,
  CalendarPlus,
  Camera,
  ChevronRight,
  CircleDollarSign,
  Heart,
  LayoutGrid,
  LogOut,
  MessageSquare,
  Pencil,
  Search,
  Settings,
  Star,
  UserPlus,
  UserRound,
  Users,
  UsersRound,
} from "lucide-react";
import { ProfileBannerAvatar } from "@/components/profile/profile-banner-avatar";
import { LEGAL_ENTITY } from "@/lib/legal";

const MYPAGE_BG = "/profile/mypage-bg.png";

const C = {
  main: "#2F8F57",
  dark: "#216B43",
  soft: "#EAF6EF",
  page: "#F7F8F5",
  card: "#FFFFFF",
  border: "#E5E7E2",
  ink: "#1F2A24",
  muted: "#7B817C",
  line: "#E5E7E2",
} as const;

const CARD_SHADOW = "0 1px 3px rgba(0,0,0,.04), 0 2px 8px rgba(0,0,0,.04)";

type Props = {
  displayName: string;
  avatarUrl: string | null;
  bio?: string | null;
  stats: {
    participated: number;
    volunteer: number;
    favorites: number;
    points: number;
  };
  plannedCount: number;
  savedCount: number;
  unreadCount: number;
  isOrganizerRegistered: boolean;
  summaryLoading?: boolean;
  onLogout: () => void;
};

type MenuItem = {
  href: string;
  title: string;
  sub: string;
  icon: React.ReactNode;
  badge?: number;
};

function MenuRow({ href, title, sub, icon, badge }: MenuItem) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2.5 border-b border-[#E5E7E2] px-3.5 py-2.5 transition-colors last:border-b-0 hover:bg-[#EAF6EF] focus-visible:bg-[#EAF6EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2F8F57]/40"
      aria-label={badge !== undefined && badge > 0 ? `${title}（${badge}）` : title}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: C.soft, color: C.main }}
        aria-hidden
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold leading-snug" style={{ color: C.ink }}>
          {title}
        </div>
        <div className="mt-px truncate text-[11px] leading-snug" style={{ color: C.muted }}>
          {sub}
        </div>
      </div>
      {badge !== undefined && badge > 0 && (
        <span
          className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums"
          style={{ backgroundColor: C.soft, color: C.dark }}
        >
          {badge}
        </span>
      )}
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#C5C9C3]" aria-hidden />
    </Link>
  );
}

function SectionCard({
  title,
  icon,
  children,
  footer,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section
      className="flex min-w-0 flex-col overflow-hidden rounded-[14px] border bg-white"
      style={{ borderColor: C.border, boxShadow: CARD_SHADOW }}
    >
      <header
        className="flex items-center gap-1.5 border-b px-3.5 py-2.5"
        style={{ borderColor: C.border }}
      >
        <span style={{ color: C.main }} aria-hidden>
          {icon}
        </span>
        <h2 className="text-[13px] font-semibold" style={{ color: C.ink }}>
          {title}
        </h2>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
      {footer}
    </section>
  );
}

function StatCell({
  label,
  value,
  icon,
  loading,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-center gap-2.5 px-2.5 py-3.5 sm:px-3">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: C.soft, color: C.main }}
        aria-hidden
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] leading-tight" style={{ color: C.muted }}>
          {label}
        </p>
        {loading ? (
          <div className="mt-1 h-4 w-10 animate-pulse rounded bg-[#EAF6EF]" />
        ) : (
          <p
            className="mt-0.5 text-[16px] font-bold leading-none tabular-nums"
            style={{ color: C.ink }}
          >
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

function PcFooter() {
  const links = [
    { href: "/terms", label: "利用規約" },
    { href: "/privacy", label: "プライバシーポリシー" },
    { href: "/commerce", label: "特定商取引法に基づく表記" },
    { href: `mailto:${LEGAL_ENTITY.email}`, label: "お問い合わせ" },
  ] as const;

  return (
    <footer
      className="mt-1 rounded-[14px] border px-4 py-3"
      style={{ backgroundColor: "#F3F4F1", borderColor: C.border }}
      aria-label="フッター"
    >
      <div
        className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px]"
        style={{ color: C.muted }}
      >
        {links.map((link) =>
          link.href.startsWith("mailto:") ? (
            <a
              key={link.href}
              href={link.href}
              className="rounded-sm transition-colors hover:text-[#2F8F57] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8F57]/40"
            >
              {link.label}
            </a>
          ) : (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-sm transition-colors hover:text-[#2F8F57] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8F57]/40"
            >
              {link.label}
            </Link>
          )
        )}
        <span className="ml-0 sm:ml-auto" style={{ color: C.muted }}>
          © MachiGlyph
        </span>
      </div>
    </footer>
  );
}

const ICON_SM = "h-3.5 w-3.5";

export function MypagePcView({
  displayName,
  avatarUrl,
  bio,
  stats,
  plannedCount,
  savedCount,
  unreadCount,
  isOrganizerRegistered,
  summaryLoading = false,
  onLogout,
}: Props) {
  const statusText = bio?.trim() || "地域のイベントに参加してみよう！";
  const messageSub =
    unreadCount > 0
      ? `${unreadCount}件の未読メッセージがあります`
      : "未読メッセージはありません";

  const quickItems: MenuItem[] = [
    {
      href: "/messages",
      title: "メッセージ",
      sub: messageSub,
      icon: <MessageSquare className={ICON_SM} strokeWidth={2} />,
      badge: unreadCount,
    },
    {
      href: "/saved",
      title: "保存したイベント",
      sub: "気になるイベントを一覧で確認できます",
      icon: <Bookmark className={ICON_SM} strokeWidth={2} />,
    },
    {
      href: "/volunteer",
      title: "応募中のボランティア",
      sub: "応募したボランティアの状況を確認できます",
      icon: <Users className={ICON_SM} strokeWidth={2} />,
    },
    {
      href: "/points",
      title: "マイポイント",
      sub: "保有ポイントと履歴を確認できます",
      icon: <CircleDollarSign className={ICON_SM} strokeWidth={2} />,
    },
  ];

  const joinItems: MenuItem[] = [
    {
      href: "/profile/events/planned",
      title: "参加予定イベント",
      sub: "参加予定にしたイベント一覧",
      icon: <CalendarDays className={ICON_SM} strokeWidth={2} />,
      badge: plannedCount,
    },
    {
      href: "/saved",
      title: "あとで見るイベント",
      sub: "お気に入りイベント一覧",
      icon: <Heart className={ICON_SM} strokeWidth={2} />,
      badge: savedCount,
    },
    {
      href: "/messages",
      title: "未読メッセージ",
      sub: "未読のメッセージを確認できます",
      icon: <MessageSquare className={ICON_SM} strokeWidth={2} />,
      badge: unreadCount,
    },
  ];

  const organizerItems: MenuItem[] = isOrganizerRegistered
    ? [
        {
          href: "/organizer",
          title: "主催ダッシュボード",
          sub: "作成中のイベント・募集・応募状況",
          icon: <LayoutGrid className={ICON_SM} strokeWidth={2} />,
        },
        {
          href: "/organizer/events/new",
          title: "イベントを作成",
          sub: "新規イベントを登録する",
          icon: <CalendarPlus className={ICON_SM} strokeWidth={2} />,
        },
        {
          href: "/organizer/recruitments/new",
          title: "募集を作成",
          sub: "ボランティアやスタッフを募集する",
          icon: <UserPlus className={ICON_SM} strokeWidth={2} />,
        },
      ]
    : [
        {
          href: "/organizer/register",
          title: "主催登録をはじめる",
          sub: "個人でも団体でも、イベント作成や募集管理を始められます",
          icon: <LayoutGrid className={ICON_SM} strokeWidth={2} />,
        },
      ];

  const settingsItems: MenuItem[] = [
    {
      href: "/profile/edit",
      title: "プロフィール設定",
      sub: "自己紹介・アイコン・基本情報",
      icon: <UserRound className={ICON_SM} strokeWidth={2} />,
    },
    {
      href: "/profile/settings",
      title: "通知設定",
      sub: "メッセージ・イベント更新の通知",
      icon: <Bell className={ICON_SM} strokeWidth={2} />,
    },
  ];

  return (
    <div
      className="hidden min-h-0 min-[900px]:flex min-[900px]:flex-1 min-[900px]:flex-col"
      style={{ backgroundColor: C.page }}
    >
      <div className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-3 px-8 py-4">
        {/* 1. プロフィールヘッダー */}
        <section
          className="relative overflow-hidden rounded-[14px] border"
          style={{
            borderColor: C.border,
            boxShadow: CARD_SHADOW,
          }}
          aria-label="プロフィール"
        >
          <div className="absolute inset-0">
            <Image
              src={MYPAGE_BG}
              alt=""
              fill
              priority
              className="object-cover object-[78%_42%] saturate-[1.08] contrast-[1.04]"
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
          </div>
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, #ffffff 0%, rgba(255,255,255,.96) 22%, rgba(255,255,255,.78) 40%, rgba(255,255,255,.35) 58%, rgba(255,255,255,.12) 72%, transparent 88%)",
            }}
          />

          <div className="relative z-[1] flex min-h-[160px] items-center gap-6 px-7 py-5 lg:px-8">
            {/* 左：プロフィール情報（視覚的なまとまり） */}
            <div className="flex min-w-0 items-center gap-5">
              <Link
                href="/profile/edit"
                className="relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8F57] focus-visible:ring-offset-2"
                aria-label="プロフィールを編集"
              >
                <div
                  className="relative h-[72px] w-[72px] overflow-hidden rounded-full"
                  style={{
                    border: "2.5px solid rgba(255,255,255,.95)",
                    boxShadow: "0 2px 8px rgba(0,0,0,.08)",
                  }}
                >
                  <ProfileBannerAvatar avatarUrl={avatarUrl} displayName={displayName} />
                </div>
                <span
                  className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white"
                  style={{ backgroundColor: C.main }}
                  aria-hidden
                >
                  <Camera className="h-3 w-3 text-white" strokeWidth={2.5} />
                </span>
              </Link>

              <div className="min-w-0">
                <p
                  className="text-[10px] font-semibold tracking-[0.18em]"
                  style={{ color: C.dark }}
                >
                  MY PAGE
                </p>
                <h1
                  className="mt-0.5 truncate text-[24px] font-bold leading-tight"
                  style={{ color: C.ink, fontFamily: "'Noto Serif JP', serif" }}
                >
                  {displayName}
                </h1>
                <p className="mt-1 line-clamp-1 text-[12px] leading-snug" style={{ color: C.muted }}>
                  {statusText}
                </p>
              </div>
            </div>

            {/* 右：操作ボタン */}
            <div className="ml-auto flex shrink-0 flex-col items-stretch gap-2">
              <Link
                href="/profile/edit"
                className="inline-flex h-9 min-w-[168px] items-center justify-center gap-1.5 rounded-full border bg-white/95 px-4 text-[12px] font-semibold whitespace-nowrap shadow-sm transition-colors hover:bg-[#EAF6EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8F57]/40"
                style={{ borderColor: C.main, color: C.dark }}
              >
                <Pencil className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
                プロフィールを編集
              </Link>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex h-9 min-w-[168px] cursor-pointer items-center justify-center gap-1.5 rounded-full border bg-white/95 px-4 text-[12px] font-semibold whitespace-nowrap shadow-sm transition-colors hover:bg-[#F7F8F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8F57]/40"
                style={{ borderColor: "#D0D3CD", color: C.muted }}
                aria-label="ログアウト"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
                ログアウト
              </button>
            </div>
          </div>
        </section>

        {/* 2. ユーザー実績 */}
        <section
          className="overflow-hidden rounded-[14px] border bg-white"
          style={{ borderColor: C.border, boxShadow: CARD_SHADOW }}
          aria-label="ユーザー実績"
        >
          <div className="grid grid-cols-2 divide-x divide-y divide-[#E5E7E2] sm:grid-cols-4 sm:divide-y-0">
            <StatCell
              label="参加したイベント"
              value={`${stats.participated}件`}
              loading={summaryLoading}
              icon={<CalendarDays className="h-4 w-4" strokeWidth={2} />}
            />
            <StatCell
              label="ボランティア参加"
              value={`${stats.volunteer}件`}
              loading={summaryLoading}
              icon={<Users className="h-4 w-4" strokeWidth={2} />}
            />
            <StatCell
              label="お気に入り"
              value={`${stats.favorites}件`}
              loading={summaryLoading}
              icon={<Heart className="h-4 w-4" strokeWidth={2} />}
            />
            <StatCell
              label="マイポイント"
              value={`${stats.points}pt`}
              loading={summaryLoading}
              icon={<CircleDollarSign className="h-4 w-4" strokeWidth={2} />}
            />
          </div>
        </section>

        {/* 3. メインメニュー 3列 */}
        <div className="grid grid-cols-3 gap-3">
          <SectionCard title="よく使う" icon={<Star className={ICON_SM} strokeWidth={2.25} />}>
            {quickItems.map((item) => (
              <MenuRow key={item.href + item.title} {...item} />
            ))}
          </SectionCard>

          <SectionCard
            title="参加する"
            icon={<UsersRound className={ICON_SM} strokeWidth={2.25} />}
            footer={
              <div className="flex flex-col gap-1.5 border-t p-3" style={{ borderColor: C.border }}>
                <Link
                  href="/"
                  className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[10px] px-3 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8F57] focus-visible:ring-offset-2"
                  style={{ backgroundColor: C.main }}
                  aria-label="イベントを探す"
                >
                  <Search className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
                  イベントを探す
                </Link>
                <Link
                  href="/messages"
                  className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[10px] border bg-white px-3 text-[13px] font-semibold transition-colors hover:bg-[#EAF6EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F8F57]/40"
                  style={{ borderColor: C.main, color: C.dark }}
                  aria-label="メッセージへ"
                >
                  <MessageSquare className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  メッセージ
                </Link>
              </div>
            }
          >
            {joinItems.map((item) => (
              <MenuRow key={item.href + item.title} {...item} />
            ))}
          </SectionCard>

          <SectionCard
            title="主催・設定"
            icon={<Settings className={ICON_SM} strokeWidth={2.25} />}
          >
            {[...organizerItems, ...settingsItems].map((item) => (
              <MenuRow key={item.href + item.title} {...item} />
            ))}
          </SectionCard>
        </div>

        <PcFooter />
      </div>
    </div>
  );
}
