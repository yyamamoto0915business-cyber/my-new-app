"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUnreadCount } from "@/hooks/use-unread-count";
import { isMessagesConversationRoute } from "@/lib/is-messages-conversation-route";

const MOBILE_ITEMS = [
  { id: "home" as const, href: "/", label: "ホーム", icon: "home" },
  { id: "messages", href: "/messages", label: "メッセージ", icon: "messages" },
  { id: "saved", href: "/saved", label: "保存", icon: "saved" },
  { id: "notifications", href: "/notifications", label: "通知", icon: "notifications" },
  { id: "profile", href: "/profile", label: "マイページ", icon: "profile" },
] as const;

function NavIcon({ icon, active }: { icon: string; active: boolean }) {
  const stroke = active ? "var(--accent)" : "currentColor";
  if (icon === "home") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    );
  }
  if (icon === "saved") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
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
  if (icon === "messages") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
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

/** モバイル用5項目ナビ（ホーム/メッセージ/保存/通知/マイページ）。役割切替は上部セグメントで行う。 */
export function MobileBottomNav() {
  /** 初回から DOM に Link を出す（SSR 含む）→ ビューポート内プリフェッチが効き、モバイルのタップが速くなりやすい */
  const pathname = usePathname() ?? "";
  const unreadCount = useUnreadCount(true);

  const items = MOBILE_ITEMS;

  const getHref = (item: (typeof MOBILE_ITEMS)[number]) => item.href;

  const isActive = (item: (typeof MOBILE_ITEMS)[number]) => {
    const href = getHref(item);
    if (item.id === "home") {
      // 「ホーム」は常に探す側トップ（/events）へ戻す導線。
      // 主催/ボランティア配下では active にしない。
      if (pathname?.startsWith("/organizer")) return false;
      if (pathname?.startsWith("/volunteer")) return false;
      // 他の下部ナビ項目に該当しない「探す側ページ群」でのみ active
      if (pathname?.startsWith("/messages")) return false;
      if (pathname?.startsWith("/saved")) return false;
      if (pathname?.startsWith("/notifications")) return false;
      if (pathname?.startsWith("/profile")) return false;
      return true;
    }
    if (item.id === "notifications") return pathname?.startsWith("/notifications");
    return pathname?.startsWith(item.href) ?? false;
  };

  const showBadge = (icon: string) =>
    (icon === "messages" || icon === "profile" || icon === "notifications") && unreadCount > 0;

  if (isMessagesConversationRoute(pathname)) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-[var(--border)] bg-white/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom,0px)] sm:hidden dark:bg-[var(--background)]"
      aria-label="モバイルナビゲーション"
    >
      <div className="mx-auto flex w-full max-w-lg items-stretch justify-around gap-0">
        {items.map((item) => {
          const href = getHref(item);
          const active = isActive(item);
          return (
          <Link
            key={item.id}
            href={href}
            prefetch
            className={`relative flex min-h-[56px] flex-1 touch-manipulation flex-col items-center justify-center gap-1.5 px-1 py-2 text-[11px] transition-colors rounded-xl ${
              active
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "text-[var(--foreground-muted)]"
            }`}
          >
            {active && (
              <span
                className="absolute left-1/2 top-0 h-0.5 w-9 -translate-x-1/2 rounded-full bg-[var(--accent)]"
                aria-hidden
              />
            )}
            <span className="relative inline-block">
              <NavIcon icon={item.icon} active={active} />
              {showBadge(item.icon) && (
                <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium leading-none text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </span>
            <span className="whitespace-nowrap text-center text-[11px] leading-tight">
              {item.label}
            </span>
          </Link>
        );})}
      </div>
    </nav>
  );
}
