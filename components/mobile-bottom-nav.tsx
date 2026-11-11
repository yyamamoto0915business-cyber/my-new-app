"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUnreadCount } from "@/hooks/use-unread-count";
import { isMessagesConversationRoute } from "@/lib/is-messages-conversation-route";
import { isProfileEditRoute } from "@/lib/is-profile-edit-route";
import { isEventFormRoute } from "@/lib/is-event-form-route";
import { isAuthRoute } from "@/lib/is-auth-route";
import { isPlayRoute } from "@/lib/is-play-route";
import { cn } from "@/lib/utils";
import { prefetchMypageSummary } from "@/lib/prefetch-mypage-summary";
import { prefetchMyPosts } from "@/lib/prefetch-my-posts";
import { MyAlbumIcon } from "@/components/profile/MyAlbumIcon";
import { ParticipationPassIcon } from "@/components/pass/ParticipationPassIcon";
import { PlayResumeBar } from "@/components/play/PlayResume";

const MOBILE_ITEMS = [
  { id: "home" as const, href: "/", label: "ホーム", icon: "home" },
  { id: "album" as const, href: "/profile/posts", label: "マイアルバム", icon: "album" },
  { id: "pass" as const, href: "/pass", label: "参加パス", icon: "pass" },
  { id: "messages" as const, href: "/messages", label: "チャット", icon: "messages" },
  { id: "profile" as const, href: "/profile", label: "マイページ", icon: "profile" },
] as const;

function NavIcon({ icon, active }: { icon: string; active: boolean }) {
  const stroke = active ? "#1f5e3a" : "#7a8a80";
  if (icon === "home") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    );
  }
  if (icon === "pass") {
    return <ParticipationPassIcon className="h-5 w-5" stroke={stroke} />;
  }
  if (icon === "messages") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    );
  }
  if (icon === "album") {
    return <MyAlbumIcon className="h-5 w-5" stroke={stroke} />;
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

/** モバイル用5項目ナビ（ホーム/マイアルバム/参加パス/チャット/マイページ）。役割切替は上部セグメントで行う。 */
export function MobileBottomNav() {
  /** 初回から DOM に Link を出す（SSR 含む）→ ビューポート内プリフェッチが効き、モバイルのタップが速くなりやすい */
  const pathname = usePathname() ?? "";
  const authRoute = isAuthRoute(pathname);
  const unreadCount = useUnreadCount(!authRoute);
  /** pathname 依存の active 表示はマウント後に揃える（SSR/CSR の不一致を防ぐ） */
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const items = MOBILE_ITEMS;

  const getHref = (item: (typeof MOBILE_ITEMS)[number]) => item.href;

  const isActive = (item: (typeof MOBILE_ITEMS)[number]) => {
    if (!hydrated) return false;
    if (item.id === "home") {
      return pathname === "/";
    }
    if (item.id === "album") return pathname?.startsWith("/profile/posts") ?? false;
    if (item.id === "profile") {
      return (
        (pathname?.startsWith("/profile") ?? false) &&
        !pathname?.startsWith("/profile/posts")
      );
    }
    /** QR読み取り・受付（/checkin/〜）も参加パスの一部として扱う */
    if (item.id === "pass") {
      return pathname.startsWith("/pass") || pathname.startsWith("/checkin");
    }
    /** messages は href がそのままプレフィックスになる */
    return pathname.startsWith(item.href);
  };

  const showBadge = (icon: string) =>
    hydrated &&
    (icon === "profile" || icon === "messages") &&
    unreadCount > 0;

  if (
    authRoute ||
    isPlayRoute(pathname) ||
    isMessagesConversationRoute(pathname) ||
    isProfileEditRoute(pathname) ||
    isEventFormRoute(pathname) ||
    pathname === "/application-form-preview" ||
    pathname === "/applications-confirm-preview" ||
    pathname.includes("/application-form")
  ) {
    return null;
  }

  return (
    <nav
      data-mg-chrome="mobile-bottom"
      className="pointer-events-none fixed bottom-0 left-0 right-0 z-50 px-3 pb-[calc(8px+env(safe-area-inset-bottom,0px))] min-[900px]:hidden"
      aria-label="モバイルナビゲーション"
      role="navigation"
      suppressHydrationWarning
    >
      {/* 浮かせた角丸のバー。ゲーム中は上に「ゲームに戻る」を重ねる */}
      <div className="pointer-events-auto mx-auto w-full overflow-hidden rounded-[28px] border border-[#e3ece5] bg-white/97 shadow-[0_8px_28px_rgba(22,56,40,0.14)] backdrop-blur-sm tablet:max-w-[560px]">
      <PlayResumeBar />
      <div className="flex w-full items-stretch justify-around gap-0 px-1.5 py-1">
        {items.map((item) => {
          const href = getHref(item);
          const active = isActive(item);
          /** 真ん中の参加パスは、選んでいなくても薄い緑の丸で目立たせる */
          const featured = item.id === "pass";
          return (
          <Link
            key={item.id}
            href={href}
            prefetch
            onTouchStart={
              item.id === "profile"
                ? () => void prefetchMypageSummary()
                : item.id === "album"
                  ? () => void prefetchMyPosts()
                  : undefined
            }
            onMouseEnter={
              item.id === "profile"
                ? () => void prefetchMypageSummary()
                : item.id === "album"
                  ? () => void prefetchMyPosts()
                  : undefined
            }
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex min-h-[52px] flex-1 touch-manipulation flex-col items-center justify-center gap-0.5 rounded-[20px] px-0.5 py-1 text-[10px] transition-colors",
              featured && "bg-[#eaf4ed]",
              active ? "font-bold text-[#1f5e3a]" : "font-medium text-[#7a8a80]",
              featured && !active && "text-[#2f6b4f]"
            )}
            suppressHydrationWarning
          >
            <span
              className="relative inline-flex items-center justify-center px-2 py-0.5"
              suppressHydrationWarning
            >
              <NavIcon icon={item.icon} active={active || featured} />
              {showBadge(item.icon) && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium leading-none text-white">
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
      </div>
    </nav>
  );
}
