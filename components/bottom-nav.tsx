"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useScopedUnreadCount } from "@/hooks/use-scoped-unread-count";
import { useRegionPreference } from "@/hooks/use-region-preference";
import { setModeCookie } from "@/lib/mode-preference";
import { RegionSettingModal } from "@/components/region/RegionSettingModal";
import {
  MapPin,
  HelpCircle,
  CalendarDays,
  CalendarCheck,
  Plus,
  Wallet,
  Gamepad2,
  MessageCircle,
  UserRound,
} from "lucide-react";
import { isOrganizerDashboardPath } from "@/lib/top-mode-active";
import { ORGANIZER_NEW_LISTING_HREF, organizerBottomNavActive } from "@/lib/organizer/organizer-nav";
import { ORGANIZER_MESSAGES_HREF } from "@/lib/messages-scope";
import { shouldHidePcGlobalNav } from "@/lib/is-auth-route";
import { ParticipationPassIcon } from "@/components/pass/ParticipationPassIcon";
import { MyAlbumIcon } from "@/components/profile/MyAlbumIcon";
import { prefetchMyPosts } from "@/lib/prefetch-my-posts";

const DESKTOP_NAV_ITEMS = [
  { href: "/", label: "ホーム", icon: "home" },
  { href: "/pass", label: "参加パス", icon: "pass" },
  { href: "/profile/posts", label: "マイアルバム", icon: "album" },
  { href: "/messages", label: "メッセージ", icon: "messages" },
  { href: "/profile", label: "マイページ", icon: "profile" },
] as const;

/** 主催者モードの左メニュー（スマホの下のナビと同じ考え方に、PC でよく使うレジ・ゲームを足す） */
const ORGANIZER_NAV_ITEMS = [
  { href: "/organizer/listings", label: "掲載管理", icon: "o-listings" },
  { href: "/organizer", label: "当日の運営", icon: "o-day" },
  { href: ORGANIZER_NEW_LISTING_HREF, label: "新しく掲載", icon: "o-new" },
  { href: "/organizer/pos", label: "レジ", icon: "o-pos" },
  { href: "/organizer/games", label: "ゲーム", icon: "o-game" },
  { href: ORGANIZER_MESSAGES_HREF, label: "チャット", icon: "o-chat" },
  { href: "/organizer/settings", label: "マイページ", icon: "o-settings" },
] as const;

const ORGANIZER_ICONS = {
  "o-listings": CalendarDays,
  "o-day": CalendarCheck,
  "o-new": Plus,
  "o-pos": Wallet,
  "o-game": Gamepad2,
  "o-chat": MessageCircle,
  "o-settings": UserRound,
} as const;

/** 掲載管理の中の画面（イベント・お店・募集などの管理・編集）も「掲載管理」を光らせる */
const ORGANIZER_LISTING_PREFIXES = [
  "/organizer/listings",
  "/organizer/events",
  "/organizer/stores",
  "/organizer/kitchen-cars",
  "/organizer/recruitments",
  "/organizer/stories",
  "/organizer/articles",
];

function isOrganizerItemActive(pathname: string, href: string): boolean {
  const isNew = organizerBottomNavActive(pathname) === "new";
  if (href === ORGANIZER_NEW_LISTING_HREF) return isNew;
  if (isNew) return false;
  if (href === "/organizer") return pathname === "/organizer" || pathname === "/organizer/home";
  if (href === "/organizer/listings") {
    return ORGANIZER_LISTING_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavIcon({ icon, active }: { icon: string; active: boolean }) {
  const stroke = active ? "#4a9a68" : "currentColor";
  if (icon in ORGANIZER_ICONS) {
    const Icon = ORGANIZER_ICONS[icon as keyof typeof ORGANIZER_ICONS];
    return <Icon className="h-6 w-6" stroke={stroke} strokeWidth={1.9} aria-hidden />;
  }
  if (icon === "home") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    );
  }
  if (icon === "pass") {
    // 画像アイコンはSVGより余白感が出やすいので一回り大きく
    return <ParticipationPassIcon className="h-8 w-8" stroke={stroke} />;
  }
  if (icon === "album") {
    return <MyAlbumIcon className="h-6 w-6" stroke={stroke} />;
  }
  if (icon === "messages") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    );
  }
  if (icon === "organizer") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    );
  }
  if (icon === "search") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function NavLink({
  item,
  isActive,
  showBadge,
  unreadCount,
  minTapHeight = true,
  showActiveIndicator = false,
}: {
  item: { href: string; label: string; icon: string };
  isActive: boolean;
  showBadge: boolean;
  unreadCount: number;
  minTapHeight?: boolean;
  /** モバイル用：アクティブ時に上部インジケータを表示 */
  showActiveIndicator?: boolean;
}) {
  const href = item.href === "/profile" ? "/profile" : item.href;
  const prefetchAlbum = item.href === "/profile/posts";
  return (
    <Link
      href={href}
      onTouchStart={prefetchAlbum ? () => void prefetchMyPosts() : undefined}
      onMouseEnter={prefetchAlbum ? () => void prefetchMyPosts() : undefined}
      className={`relative flex flex-1 flex-col items-center gap-1 text-[13px] transition-colors sm:flex-none sm:w-full sm:px-2 ${
        minTapHeight ? "min-h-[44px] justify-center py-3 sm:py-2" : "py-3 sm:py-2.5"
      } ${isActive ? "text-[#4a9a68] sm:text-[#4a9a68]" : "text-[var(--foreground-muted)] sm:text-[#8a9088]"}`}
    >
      {isActive && (
        <span
          className="absolute left-0 top-1/2 hidden h-8 w-[3px] -translate-y-1/2 rounded-r-full bg-[#4a9a68] sm:block"
          aria-hidden
        />
      )}
      {showActiveIndicator && isActive && (
        <span
          className="absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-full bg-[var(--accent)] sm:hidden"
          aria-hidden
        />
      )}
      <span className="relative inline-block">
        <NavIcon icon={item.icon} active={isActive} />
        {showBadge && (
          <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </span>
      <span className="text-center text-[9px] leading-tight font-medium whitespace-nowrap">{item.label}</span>
    </Link>
  );
}

/** PC用6項目サイドナビ（900px以上表示・モバイル時は非表示） */
export function BottomNav() {
  const pathname = usePathname() ?? "";
  const hideOnAuth = shouldHidePcGlobalNav(pathname);
  const organizerArea = isOrganizerDashboardPath(pathname);
  // 利用者モードでは利用者のチャット（/messages）、主催者モードでは主催者のチャットの未読
  const memberUnread = useScopedUnreadCount("member", !hideOnAuth && !organizerArea);
  const organizerUnread = useScopedUnreadCount("organizer", !hideOnAuth && organizerArea);
  const unreadCount = organizerArea ? organizerUnread : memberUnread;

  useEffect(() => {
    if (pathname.startsWith("/organizer")) {
      setModeCookie("ORGANIZER");
    }
  }, [pathname]);

  const isActive = (href: string) => {
    if (organizerArea) return isOrganizerItemActive(pathname, href);
    if (href === "/") return pathname === "/";
    if (href === "/organizer/listings") return pathname.startsWith("/organizer");
    if (href === "/profile/posts") return pathname.startsWith("/profile/posts");
    if (href === "/profile") {
      return pathname.startsWith("/profile") && !pathname.startsWith("/profile/posts");
    }
    return pathname.startsWith(href);
  };

  const showBadge = (icon: string) =>
    (icon === "messages" || icon === "profile" || icon === "o-chat") && unreadCount > 0;
  const items = organizerArea ? ORGANIZER_NAV_ITEMS : DESKTOP_NAV_ITEMS;

  if (hideOnAuth) return null;

  return (
    <nav
      data-mg-chrome="pc-rail"
      className="fixed inset-y-0 left-0 z-50 hidden w-20 flex-col items-center border-r border-[#e8ebe6] bg-white py-5 pt-[calc(1.25rem+env(safe-area-inset-top,0px))] min-[900px]:flex"
      aria-label={organizerArea ? "主催者メニュー" : "PCナビゲーション"}
    >
      <div className="flex w-full flex-col items-center justify-start gap-0">
        {items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={isActive(item.href)}
            showBadge={showBadge(item.icon)}
            unreadCount={unreadCount}
            minTapHeight={false}
          />
        ))}
      </div>
      <SidebarFooter showRegion={!organizerArea} />
    </nav>
  );
}

function SidebarFooter({ showRegion = true }: { showRegion?: boolean }) {
  const { label, preference, hydrated } = useRegionPreference();
  const [modalOpen, setModalOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hasRegion = hydrated && Boolean(preference.prefecture);
  const displayLabel = hydrated ? label || "未設定" : "未設定";

  return (
    <div className="mt-auto flex w-full shrink-0 flex-col items-center gap-3 px-1 pb-3">
      {showRegion ? (
      <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setModalOpen(true)}
        className={`relative flex w-full flex-col items-center gap-1 rounded-lg border px-1 py-2 text-center transition ${
          hasRegion
            ? "border-[#b8dcc8] bg-[#f4faf6] hover:bg-[#eef6f2]"
            : "border-transparent hover:bg-[#f4faf6]"
        }`}
        aria-label="地域を設定"
        aria-haspopup="dialog"
        aria-expanded={modalOpen}
      >
        {hasRegion && (
          <span
            className="absolute right-1 top-2 h-1.5 w-1.5 rounded-full bg-[#4a9a68]"
            aria-hidden
          />
        )}
        <MapPin className="h-4 w-4 text-[#48a878]" aria-hidden />
        <span className="text-[9px] font-medium leading-tight text-[#3a5848]">地域を設定</span>
        <span className="line-clamp-2 text-[8px] leading-tight text-[#6a6258]" suppressHydrationWarning>
          {displayLabel}
        </span>
      </button>
      <RegionSettingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        anchorRef={triggerRef}
      />
      </>
      ) : null}
      <Link
        href="/guide"
        className="flex w-full flex-col items-center gap-1 rounded-lg px-1 py-2 text-[9px] font-medium text-[#3a5848] transition hover:bg-[#f4faf6]"
        aria-label="ヘルプ"
      >
        <HelpCircle className="h-4 w-4" aria-hidden />
        ヘルプ
      </Link>
    </div>
  );
}
