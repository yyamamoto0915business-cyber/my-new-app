"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useUnreadCount } from "@/hooks/use-unread-count";
import { getModeFromCookie } from "@/lib/mode-preference";
import { getOrganizerMode } from "@/lib/organizer-mode";

const MOBILE_ITEMS = [
  { href: "/", label: "ホーム", icon: "home" },
  { href: "/discover", label: "探す", icon: "search" },
  { href: "/messages", label: "メッセージ", icon: "messages" },
  { href: "/profile", label: "マイ", icon: "profile" },
] as const;

function NavIcon({ icon, active }: { icon: string; active: boolean }) {
  const stroke = active ? "var(--accent)" : "currentColor";
  if (icon === "home") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
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
  if (icon === "messages") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    );
  }
  if (icon === "profile") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    );
  }
  return null;
}

/** モバイル用4項目ナビ（sm以下表示・タップ44px・ラベル1行） */
export function MobileBottomNav() {
  const pathname = usePathname();
  const unreadCount = useUnreadCount(true);
  const [mounted, setMounted] = useState(false);
  const [organizerMode, setOrganizerModeState] = useState(false);

  useEffect(() => setMounted(true), []);
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

  const isOrganizerMode =
    pathname.startsWith("/organizer") ||
    getModeFromCookie() === "ORGANIZER" ||
    organizerMode;
  const items = isOrganizerMode
    ? [
        { href: "/", label: "ホーム", icon: "home" as const },
        { href: "/organizer/events", label: "主催", icon: "organizer" as const },
        { href: "/messages", label: "メッセージ", icon: "messages" as const },
        { href: "/profile", label: "マイ", icon: "profile" as const },
      ]
    : MOBILE_ITEMS;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const showBadge = (icon: string) =>
    (icon === "messages" || icon === "profile") && unreadCount > 0;

  if (!mounted) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-[var(--border)] bg-white/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom,0px)] sm:hidden dark:bg-[var(--background)]"
      aria-label="モバイルナビゲーション"
    >
      <div className="mx-auto flex w-full max-w-lg items-center justify-around">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href === "/profile" ? "/profile" : item.href}
            className={`relative flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1 py-3 text-xs transition-colors ${
              isActive(item.href) ? "text-[var(--accent)]" : "text-[var(--foreground-muted)]"
            }`}
          >
            {isActive(item.href) && (
              <span
                className="absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-full bg-[var(--accent)]"
                aria-hidden
              />
            )}
            <span className="relative inline-block">
              {item.icon === "organizer" ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={isActive(item.href) ? "var(--accent)" : "currentColor"} strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              ) : (
                <NavIcon icon={item.icon} active={isActive(item.href)} />
              )}
              {showBadge(item.icon) && (
                <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium leading-none text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </span>
            <span className="whitespace-nowrap text-center leading-tight">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
