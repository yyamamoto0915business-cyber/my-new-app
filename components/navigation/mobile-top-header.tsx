"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { TopModeTabs, type TopModeTabId } from "@/components/navigation/top-mode-tabs";
import { setModeCookie } from "@/lib/mode-preference";
import { NotificationBell } from "@/components/notification-bell";
import { cn } from "@/lib/utils";
import { isOrganizerDashboardPath } from "@/lib/top-mode-active";
import { ArrowLeftRight } from "lucide-react";
import { ORGANIZER_MOBILE_HOME_HREF } from "@/lib/organizer/organizer-nav";
import { isEventDetailRoute } from "@/lib/is-event-detail-route";
import { isMessagesConversationRoute } from "@/lib/is-messages-conversation-route";
import { isProfileEditRoute } from "@/lib/is-profile-edit-route";
import { isEventFormRoute } from "@/lib/is-event-form-route";
import { isPlayRoute } from "@/lib/is-play-route";
import { isPostDetailRoute } from "@/lib/is-post-detail-route";

/**
 * 利用者側のモバイル上部の高さ（safe-area 除く）
 * 上8 + 1行目36 + 間6 + 2択タブ40（32 + 内側3×2 + 枠2） + 下8
 */
export const MOBILE_TOP_HEADER_HEIGHT_PX = 98;

/** 主催者側（1行だけ）の高さ（safe-area 除く）。上8 + 1行目36 + 下8 */
export const MOBILE_TOP_HEADER_HEIGHT_ORGANIZER_PX = 52;

const MOBILE_TOP_HEADER_CSS_VAR = "--mg-mobile-top-header-h";

export function getMobileTopHeaderHeightPx(pathname: string | null | undefined): number {
  if (!pathname) return MOBILE_TOP_HEADER_HEIGHT_PX;
  if (isOrganizerDashboardPath(pathname)) return MOBILE_TOP_HEADER_HEIGHT_ORGANIZER_PX;
  return MOBILE_TOP_HEADER_HEIGHT_PX;
}

type Props = {
  className?: string;
};

export function MobileTopHeader({ className }: Props) {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const organizerArea = pathname ? isOrganizerDashboardPath(pathname) : false;
  const handleTabClick = (id: TopModeTabId) => {
    setModeCookie(id === "machi" ? "VOLUNTEER" : "EVENT");
  };

  useEffect(() => {
    if (!organizerArea) return;

    const el = headerRef.current;
    if (!el) return;

    const syncHeight = () => {
      const safeTop = parseFloat(getComputedStyle(el).paddingTop) || 0;
      const contentH = Math.ceil(el.getBoundingClientRect().height - safeTop);
      document.documentElement.style.setProperty(
        MOBILE_TOP_HEADER_CSS_VAR,
        `${contentH}px`
      );
    };

    syncHeight();
    const ro = new ResizeObserver(syncHeight);
    ro.observe(el);
    window.addEventListener("resize", syncHeight);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", syncHeight);
      document.documentElement.style.removeProperty(MOBILE_TOP_HEADER_CSS_VAR);
    };
  }, [organizerArea]);

  if (
    isEventDetailRoute(pathname ?? "") ||
    isMessagesConversationRoute(pathname ?? "") ||
    isProfileEditRoute(pathname ?? "") ||
    isEventFormRoute(pathname) ||
    isPlayRoute(pathname) ||
    // 投稿の詳細は画面専用の「← みんなの投稿」帯があるので、上の帯を2段にしない
    isPostDetailRoute(pathname)
  ) {
    return null;
  }

  return (
    <header
      ref={headerRef}
      data-mg-chrome="mobile-top"
      className={cn(
        "sticky top-0 z-40 min-[900px]:hidden pt-[env(safe-area-inset-top,0px)]",
        organizerArea
          ? "bg-white shadow-[0_1px_0_rgba(15,23,42,0.06)]"
          : "bg-gradient-to-b from-[#eef6ee] via-[#f7fbf6] to-[#fbfcf9]",
        className
      )}
      aria-label="MachiGlyph 上部ヘッダー"
    >
      <div className={cn("w-full px-4", organizerArea ? "pb-2 pt-2" : "pb-2 pt-2")}>
        {/* 1行目：ロゴ／モード切替／お知らせ（利用者・主催者で同じ形） */}
        <div className="flex h-9 items-center justify-between gap-2">
          <Link
            href={organizerArea ? ORGANIZER_MOBILE_HOME_HREF : "/"}
            className="flex min-w-0 items-center gap-1.5"
            aria-label="MachiGlyph ホームへ"
          >
            <Image
              src="/brand/machiglyph_mark.png"
              alt=""
              width={32}
              height={32}
              unoptimized
              className="h-8 w-8 shrink-0 object-contain bg-transparent"
            />
            <span
              className="truncate text-[15px] font-semibold tracking-[-0.02em] text-[#163828]"
              style={{ fontFamily: "var(--font-serif-display)" }}
            >
              MachiGlyph
            </span>
          </Link>

          <div className="flex shrink-0 items-center justify-end gap-1.5">
            <Link
              href={organizerArea ? "/" : ORGANIZER_MOBILE_HOME_HREF}
              prefetch
              onClick={() => setModeCookie(organizerArea ? "EVENT" : "ORGANIZER")}
              className="flex h-9 items-center gap-1 rounded-full border border-[#dde9e1] bg-white px-3 text-[12px] font-semibold text-[#1f5e3a] shadow-[0_2px_8px_rgba(22,56,40,0.06)] active:bg-[#f4f8f5]"
            >
              <ArrowLeftRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="whitespace-nowrap">
                {organizerArea ? "利用者へ" : "主催者モードへ"}
              </span>
            </Link>
            <Suspense fallback={null}>
              <NotificationBell className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#dde9e1] bg-white text-[#163828] shadow-[0_2px_8px_rgba(22,56,40,0.06)] active:bg-[#f7fbf8] hover:bg-white hover:text-[#163828]" />
            </Suspense>
          </div>
        </div>

        {/* 2行目：まちの情報｜みんなの投稿（利用者側だけ） */}
        {!organizerArea && (
          <TopModeTabs className="mt-1.5" onTabClick={handleTabClick} />
        )}
      </div>
    </header>
  );
}
