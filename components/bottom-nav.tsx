"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUnreadCount } from "@/hooks/use-unread-count";
import { getModeFromCookie, setModeCookie } from "@/lib/mode-preference";
import { getOrganizerMode, setOrganizerMode } from "@/lib/organizer-mode";

const DESKTOP_NAV_ITEMS = [
  { href: "/", label: "ホーム", icon: "home" },
  { href: "/stories", label: "ストーリー", icon: "story" },
  { href: "/volunteer", label: "ボランティア", icon: "volunteer" },
  { href: "/messages", label: "メッセージ", icon: "messages" },
  { href: "/organizer/events", label: "主催", icon: "organizer" },
  { href: "/profile", label: "マイページ", icon: "profile" },
] as const;

type NavItem = { href: string; label: string; icon: string };

/** モバイル用4項目（2番目は主催者モード時のみ主催に差し替え） */
function getMobileNavItems(
  pathname: string,
  organizerModeFromStorage: boolean
): NavItem[] {
  const isOrganizerMode =
    pathname.startsWith("/organizer") ||
    getModeFromCookie() === "ORGANIZER" ||
    organizerModeFromStorage;
  const secondItem = isOrganizerMode
    ? { href: "/organizer/events", label: "主催", icon: "organizer" as const }
    : { href: "/discover", label: "探す", icon: "search" as const };
  return [
    { href: "/", label: "ホーム", icon: "home" },
    secondItem,
    { href: "/messages", label: "メッセージ", icon: "messages" },
    { href: "/profile", label: "マイ", icon: "profile" },
  ];
}

function NavIcon({ icon, active }: { icon: string; active: boolean }) {
  const stroke = active ? "var(--accent)" : "currentColor";
  if (icon === "home") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    );
  }
  if (icon === "story") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    );
  }
  if (icon === "volunteer") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    );
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
  return (
    <Link
      href={href}
      className={`relative flex flex-1 flex-col items-center gap-1 text-xs transition-colors md:flex-none md:w-full md:px-2 ${
        minTapHeight ? "min-h-[44px] justify-center py-3 md:py-2" : "py-3 md:py-2"
      } ${isActive ? "text-[var(--accent)]" : "text-[var(--foreground-muted)]"}`}
    >
      {showActiveIndicator && isActive && (
        <span
          className="absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-full bg-[var(--accent)] md:hidden"
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
      <span className="text-center leading-tight whitespace-nowrap">{item.label}</span>
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const unreadCount = useUnreadCount(true);
  const [mounted, setMounted] = useState(false);
  const [organizerMode, setOrganizerModeState] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (pathname.startsWith("/organizer")) {
      setModeCookie("ORGANIZER");
      setOrganizerMode(true);
    }
  }, [pathname]);

  useEffect(() => {
    setOrganizerModeState(getOrganizerMode());
    const handler = () => setOrganizerModeState(getOrganizerMode());
    window.addEventListener("storage", handler);
    window.addEventListener("organizer-mode-change", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("organizer-mode-change", handler);
    };
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const mobileItems = mounted
    ? getMobileNavItems(pathname, organizerMode)
    : getMobileNavItems("/", false);
  const showBadge = (icon: string) =>
    (icon === "messages" || icon === "profile") && unreadCount > 0;

  return (
    <nav
      className="fixed z-50 flex bg-white/95 backdrop-blur-sm dark:bg-[var(--background)]
        bottom-0 left-0 right-0 border-t border-[var(--border)]
        pb-[env(safe-area-inset-bottom,0px)]
        md:border-t-0 md:border-r md:pb-0 md:left-0 md:top-0 md:bottom-0 md:right-auto md:w-20 md:flex-col md:items-center md:py-4"
      aria-label="メインナビゲーション"
    >
      {/* モバイル: 4項目（タップ領域44px・ラベル1行） */}
      <div className="mx-auto flex w-full max-w-lg flex-1 items-center justify-around md:hidden">
        {mobileItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={isActive(item.href)}
            showBadge={showBadge(item.icon)}
            unreadCount={unreadCount}
            minTapHeight
            showActiveIndicator
          />
        ))}
      </div>
      {/* PC: 6項目（現状維持） */}
      <div className="hidden md:flex md:w-full md:flex-col md:items-center md:justify-start md:gap-0">
        {DESKTOP_NAV_ITEMS.map((item) => (
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
    </nav>
  );
}
