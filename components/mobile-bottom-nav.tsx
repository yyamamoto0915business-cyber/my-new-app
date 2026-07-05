"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUnreadCount } from "@/hooks/use-unread-count";
import { isOrganizerDashboardPath } from "@/lib/top-mode-active";
import { isMessagesConversationRoute } from "@/lib/is-messages-conversation-route";
import { cn } from "@/lib/utils";

const MOBILE_ITEMS = [
  { id: "home" as const, href: "/", label: "ホーム", icon: "home" },
  { id: "discover" as const, href: "/events", label: "探す", icon: "discover" },
  { id: "checkin" as const, href: "/checkin", label: "チェックイン", icon: "checkin" },
  { id: "notifications" as const, href: "/notifications", label: "通知", icon: "notifications" },
  { id: "profile" as const, href: "/profile", label: "マイページ", icon: "profile" },
] as const;

function NavIcon({ icon, active }: { icon: string; active: boolean }) {
  const stroke = active ? "#2f7d4e" : "#7a8a80";
  if (icon === "home") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    );
  }
  if (icon === "checkin") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7V5a1 1 0 011-1h2M16 4h2a1 1 0 011 1v2M20 16v2a1 1 0 01-1 1h-2M8 20H6a1 1 0 01-1-1v-2M8 11h8" />
      </svg>
    );
  }
  if (icon === "notifications") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    );
  }
  if (icon === "discover") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    );
  }
  if (icon === "profile") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    );
  }
  return null;
}

/** モバイル用5項目ナビ（ホーム/探す/チェックイン/通知/マイページ）。役割切替は上部セグメントで行う。 */
export function MobileBottomNav() {
  /** 初回から DOM に Link を出す（SSR 含む）→ ビューポート内プリフェッチが効き、モバイルのタップが速くなりやすい */
  const pathname = usePathname() ?? "";
  const unreadCount = useUnreadCount(true);

  const items = MOBILE_ITEMS;

  const getHref = (item: (typeof MOBILE_ITEMS)[number]) => item.href;

  const isActive = (item: (typeof MOBILE_ITEMS)[number]) => {
    if (item.id === "home") {
      return pathname === "/";
    }
    if (item.id === "discover") {
      if (pathname && isOrganizerDashboardPath(pathname)) return false;
      if (pathname?.startsWith("/volunteer")) return false;
      return pathname?.startsWith("/events") ?? false;
    }
    if (item.id === "notifications") return pathname?.startsWith("/notifications");
    if (item.id === "checkin") return pathname?.startsWith("/checkin");
    return pathname?.startsWith(item.href) ?? false;
  };

  const showBadge = (icon: string) =>
    (icon === "profile" || icon === "notifications") && unreadCount > 0;

  if (isMessagesConversationRoute(pathname)) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#dde9e1] bg-[#f7fbf8]/98 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_16px_rgba(22,56,40,0.05)] backdrop-blur-sm sm:hidden"
      aria-label="モバイルナビゲーション"
      role="navigation"
    >
      <div className="flex w-full items-stretch justify-around gap-0 px-1">
        {items.map((item) => {
          const href = getHref(item);
          const active = isActive(item);
          return (
          <Link
            key={item.id}
            href={href}
            prefetch
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative mx-0.5 flex min-h-[48px] flex-1 touch-manipulation flex-col items-center justify-center gap-px px-0.5 py-1 text-[10px] transition-colors",
              active ? "text-[#2f7d4e]" : "text-[#7a8a80]"
            )}
          >
            <span
              className={cn(
                "relative inline-flex items-center justify-center rounded-full px-3 py-1",
                active && "bg-[#eef6f2]"
              )}
            >
              <NavIcon icon={item.icon} active={active} />
              {showBadge(item.icon) && (
                <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium leading-none text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </span>
            <span className="whitespace-nowrap text-center text-[10px] leading-tight">
              {item.label}
            </span>
          </Link>
        );})}
      </div>
    </nav>
  );
}
