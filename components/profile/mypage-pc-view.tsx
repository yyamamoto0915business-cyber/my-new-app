"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Bell,
  Bookmark,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Lock,
  LogOut,
  MapPin,
  MessageSquare,
  Search,
  Ticket,
  UserRound,
  Users,
} from "lucide-react";
import { MypageMobileProfileCard } from "@/components/profile/mypage-mobile-profile-card";
import { MypageMobileOrganize } from "@/components/profile/mypage-mobile-organize";
import { MypageMobileAlbum } from "@/components/profile/mypage-mobile-album";
import { MypageMobileFooterLinks } from "@/components/profile/mypage-mobile-footer-links";
import type {
  MypageActivityItem,
  MypageNextEvent,
  MypageNextVolunteer,
} from "@/lib/mypage-summary-types";
import { formatEventDate, formatTimeToHm } from "@/lib/format-date";

const C = {
  main: "#2F8F57",
  dark: "#216B43",
  soft: "#EAF6EF",
  page: "#F7F8F5",
  border: "#E5E7E2",
  ink: "#1F2A24",
  muted: "#7B817C",
} as const;

const CARD_SHADOW = "0 1px 3px rgba(0,0,0,.04), 0 2px 8px rgba(0,0,0,.04)";
const ICON_SM = "h-3.5 w-3.5";

export type MypagePcViewProps = {
  displayName: string;
  avatarUrl: string | null;
  bio?: string | null;
  region?: string | null;
  counts: {
    planned: number;
    interested: number;
    passes: number;
    volunteerApplications: number;
  };
  nextEvent: MypageNextEvent | null;
  nextVolunteer: MypageNextVolunteer | null;
  activity: MypageActivityItem[];
  unreadCount: number;
  isOrganizerRegistered: boolean;
  social?: {
    album: number;
    followers: number;
    following: number;
  };
  onLogout: () => void;
};

function MenuRow({
  href,
  title,
  sub,
  icon,
  badge,
}: {
  href: string;
  title: string;
  sub?: string;
  icon: React.ReactNode;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2 border-b border-[#E5E7E2] px-3 py-2 transition-colors last:border-b-0 hover:bg-[#EAF6EF] focus-visible:bg-[#EAF6EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2F8F57]/40"
      aria-label={badge !== undefined && badge > 0 ? `${title}（${badge}）` : title}
    >
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: C.soft, color: C.main }}
        aria-hidden
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold leading-snug" style={{ color: C.ink }}>
          {title}
        </div>
        {sub && (
          <div className="mt-px truncate text-[10px] leading-snug" style={{ color: C.muted }}>
            {sub}
          </div>
        )}
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
  children,
  headerRight,
}: {
  title: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}) {
  return (
    <section
      className="flex min-w-0 flex-col overflow-hidden rounded-[14px] border bg-white"
      style={{ borderColor: C.border, boxShadow: CARD_SHADOW }}
    >
      <header
        className="flex items-center justify-between gap-2 border-b px-3 py-2"
        style={{ borderColor: C.border }}
      >
        <h2 className="text-[12px] font-semibold" style={{ color: C.ink }}>
          {title}
        </h2>
        {headerRight}
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </section>
  );
}

function NextEventCard({ event }: { event: MypageNextEvent }) {
  const time =
    event.startTime && event.endTime
      ? `${formatTimeToHm(event.startTime)}–${formatTimeToHm(event.endTime)}`
      : formatTimeToHm(event.startTime);

  return (
    <article
      className="flex flex-col overflow-hidden rounded-[14px] border bg-white"
      style={{ borderColor: C.border, boxShadow: CARD_SHADOW }}
    >
      <header className="border-b px-3 py-2" style={{ borderColor: C.border }}>
        <h2 className="text-[12px] font-semibold" style={{ color: C.ink }}>
          次に参加するイベント
        </h2>
      </header>
      <div className="flex gap-3 p-3">
        <div className="relative h-[88px] w-[120px] shrink-0 overflow-hidden rounded-[10px] bg-[#F3F4F1]">
          {event.imageUrl ? (
            <Image src={event.imageUrl} alt="" fill className="object-cover" sizes="120px" />
          ) : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-[11px] font-medium" style={{ color: C.dark }}>
            {event.date ? formatEventDate(event.date) : ""}
            {time ? ` ${time}` : ""}
          </p>
          <h3 className="line-clamp-2 text-[14px] font-bold leading-snug" style={{ color: C.ink }}>
            {event.title}
          </h3>
          <p className="flex items-start gap-1 text-[11px]" style={{ color: C.muted }}>
            <MapPin className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
            <span className="line-clamp-1">{event.location}</span>
          </p>
          <div className="mt-auto flex items-center gap-2 pt-1">
            <Link
              href={event.passHref}
              className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-[8px] text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: C.main }}
            >
              <Ticket className="h-3 w-3" aria-hidden />
              参加パス
            </Link>
            <Link
              href={`/events/${event.id}`}
              className="inline-flex h-8 items-center justify-center px-2 text-[11px] font-medium transition-colors hover:text-[#2F8F57]"
              style={{ color: C.muted }}
            >
              詳細
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function EmptyNextEvent() {
  return (
    <article
      className="flex flex-col overflow-hidden rounded-[14px] border bg-white"
      style={{ borderColor: C.border, boxShadow: CARD_SHADOW }}
    >
      <header className="border-b px-3 py-2" style={{ borderColor: C.border }}>
        <h2 className="text-[12px] font-semibold" style={{ color: C.ink }}>
          次に参加するイベント
        </h2>
      </header>
      <div className="flex items-center gap-3 px-3.5 py-3.5">
        <CalendarDays className="h-6 w-6 shrink-0" style={{ color: C.main }} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium" style={{ color: C.ink }}>
            まだ参加予定はありません
          </p>
          <p className="text-[11px]" style={{ color: C.muted }}>
            気になるイベントを見つけてみましょう
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-[8px] px-3 text-[12px] font-semibold text-white"
          style={{ backgroundColor: C.main }}
        >
          <Search className="h-3.5 w-3.5" aria-hidden />
          探す
        </Link>
      </div>
    </article>
  );
}

function MypagePcSidebar({
  counts,
  unreadCount,
  settingsOpen,
  onSettingsToggle,
  onLogout,
}: {
  counts: MypagePcViewProps["counts"];
  unreadCount: number;
  settingsOpen: boolean;
  onSettingsToggle: () => void;
  onLogout: () => void;
}) {
  return (
    <aside className="flex flex-col gap-2.5">
      <SectionCard title="保存・応募">
        <MenuRow
          href="/pass"
          title="参加パス"
          icon={<Ticket className={ICON_SM} strokeWidth={2} />}
          badge={counts.passes}
        />
        <MenuRow
          href="/saved?tab=events"
          title="あとで見る"
          icon={<Bookmark className={ICON_SM} strokeWidth={2} />}
          badge={counts.interested}
        />
        <MenuRow
          href="/profile/volunteer"
          title="ボランティア応募履歴"
          icon={<Users className={ICON_SM} strokeWidth={2} />}
          badge={counts.volunteerApplications}
        />
        <MenuRow
          href="/messages"
          title="メッセージ"
          sub={unreadCount > 0 ? `${unreadCount}件の未読` : undefined}
          icon={<MessageSquare className={ICON_SM} strokeWidth={2} />}
          badge={unreadCount}
        />
      </SectionCard>

      <section
        className="overflow-hidden rounded-[14px] border bg-white"
        style={{ borderColor: C.border, boxShadow: CARD_SHADOW }}
      >
        <button
          type="button"
          onClick={onSettingsToggle}
          className="flex w-full cursor-pointer items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-[#EAF6EF]"
          aria-expanded={settingsOpen}
        >
          <h2 className="text-[12px] font-semibold" style={{ color: C.ink }}>
            設定・サポート
          </h2>
          <ChevronDown
            className={`h-4 w-4 text-[#C5C9C3] transition-transform ${
              settingsOpen ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        </button>
        {settingsOpen && (
          <>
            <MenuRow
              href="/profile/edit"
              title="プロフィール設定"
              icon={<UserRound className={ICON_SM} strokeWidth={2} />}
            />
            <MenuRow
              href="/profile/privacy"
              title="公開 / 非公開"
              icon={<Lock className={ICON_SM} strokeWidth={2} />}
            />
            <MenuRow
              href="/profile/settings"
              title="通知設定"
              icon={<Bell className={ICON_SM} strokeWidth={2} />}
            />
            <MenuRow
              href="/contact"
              title="ヘルプ・お問い合わせ"
              icon={<HelpCircle className={ICON_SM} strokeWidth={2} />}
            />
          </>
        )}
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full cursor-pointer items-center justify-center gap-1.5 border-t px-3 py-2.5 text-[13px] font-semibold transition-colors hover:bg-[#FEF2F2]"
          style={{ borderColor: C.border, color: "#C53030", backgroundColor: "#FFF5F5" }}
          aria-label="ログアウト"
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
          ログアウト
        </button>
      </section>

      <MypageMobileFooterLinks />
    </aside>
  );
}

export function MypagePcView({
  displayName,
  avatarUrl,
  bio,
  region,
  counts,
  nextEvent,
  nextVolunteer,
  activity,
  unreadCount,
  isOrganizerRegistered,
  social,
  onLogout,
}: MypagePcViewProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const hasActivity = activity.length > 0;

  return (
    <div
      className="hidden min-h-0 min-[900px]:flex min-[900px]:flex-1 min-[900px]:flex-col"
      style={{ backgroundColor: C.page }}
    >
      <div className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-2.5 px-8 py-3">
        <MypageMobileProfileCard
          displayName={displayName}
          avatarUrl={avatarUrl}
          bio={bio}
          region={region}
          isOrganizerRegistered={isOrganizerRegistered}
          onLogout={onLogout}
          showLogout={false}
          social={social}
        />

        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-12">
          <div className="flex flex-col gap-2.5 lg:col-span-8">
            <div className="flex flex-col gap-2">
              {nextEvent ? <NextEventCard event={nextEvent} /> : <EmptyNextEvent />}
              {nextVolunteer && (
                <Link
                  href={nextVolunteer.href}
                  className="flex items-center gap-3 rounded-[14px] border bg-white px-3 py-2.5 transition-colors hover:bg-[#EAF6EF]"
                  style={{ borderColor: C.border, boxShadow: CARD_SHADOW }}
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: C.soft, color: C.main }}
                  >
                    <Users className="h-3.5 w-3.5" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium" style={{ color: C.dark }}>
                      次のボランティア · {nextVolunteer.statusLabel}
                    </p>
                    <p className="truncate text-[12px] font-semibold" style={{ color: C.ink }}>
                      {nextVolunteer.roleLabel || nextVolunteer.title}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#C5C9C3]" aria-hidden />
                </Link>
              )}
            </div>

            <MypageMobileAlbum />

            <MypageMobileOrganize isOrganizerRegistered={isOrganizerRegistered} />

            {hasActivity && (
              <SectionCard
                title="最近の動き"
                headerRight={
                  <Link
                    href="/profile/activity"
                    className="text-[11px] font-medium"
                    style={{ color: C.dark }}
                  >
                    すべて見る
                  </Link>
                }
              >
                {activity.slice(0, 3).map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="flex items-center gap-2.5 border-b border-[#E5E7E2] px-3 py-2 transition-colors last:border-b-0 hover:bg-[#EAF6EF]"
                  >
                    {item.thumbUrl ? (
                      <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-md bg-[#F3F4F1]">
                        <Image
                          src={item.thumbUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="28px"
                        />
                      </div>
                    ) : (
                      <div
                        className="h-7 w-7 shrink-0 rounded-md"
                        style={{ backgroundColor: C.soft }}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-medium" style={{ color: C.ink }}>
                        {item.text}
                      </p>
                      <p className="text-[10px]" style={{ color: C.muted }}>
                        {item.dateLabel}
                      </p>
                    </div>
                  </Link>
                ))}
              </SectionCard>
            )}
          </div>

          <div className="lg:col-span-4">
            <MypagePcSidebar
              counts={counts}
              unreadCount={unreadCount}
              settingsOpen={settingsOpen}
              onSettingsToggle={() => setSettingsOpen((v) => !v)}
              onLogout={onLogout}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
