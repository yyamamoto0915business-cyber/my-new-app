"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { ParticipationPassIcon } from "@/components/pass/ParticipationPassIcon";
import { TopModeTabs, type TopModeTabId } from "@/components/navigation/top-mode-tabs";
import { setModeCookie } from "@/lib/mode-preference";
import { NotificationBell } from "@/components/notification-bell";
import { cn } from "@/lib/utils";
import { isOrganizerDashboardPath } from "@/lib/top-mode-active";
import { isAuthRoute } from "@/lib/is-auth-route";
import { isEventDetailRoute } from "@/lib/is-event-detail-route";
import { isMessagesConversationRoute } from "@/lib/is-messages-conversation-route";
import { isProfileEditRoute } from "@/lib/is-profile-edit-route";

/** 通常時（イベント・まち情報中心）のモバイル上部の目安高さ（safe-area 除く） */
export const MOBILE_TOP_HEADER_HEIGHT_PX = 88;

/** 主催者ルート（モードタブのみ）のフォールバック高さ（safe-area 除く・実測で上書き） */
export const MOBILE_TOP_HEADER_HEIGHT_ORGANIZER_PX = 46;

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
  const authArea = isAuthRoute(pathname);

  const handleTabClick = (id: TopModeTabId) => {
    const mode =
      id === "organizer" ? "ORGANIZER" : id === "machi" ? "VOLUNTEER" : "EVENT";
    setModeCookie(mode);
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
    isProfileEditRoute(pathname ?? "")
  ) {
    return null;
  }

  return (
    <header
      ref={headerRef}
      className={cn(
        "sticky top-0 z-40 min-[900px]:hidden bg-[#ffffff]",
        organizerArea
          ? "pt-[env(safe-area-inset-top,0px)] pb-0 shadow-[0_1px_0_rgba(15,23,42,0.06)]"
          : "border-b border-[#dde9e1] pb-1 pt-[env(safe-area-inset-top,0px)]",
        className
      )}
      aria-label="MachiGlyph 上部ヘッダー"
    >
      <div className="w-full px-3">
        <div className={organizerArea ? "mt-0.5 pb-1" : "pt-0.5"}>
          <TopModeTabs compact={organizerArea} onTabClick={handleTabClick} />
        </div>

        {organizerArea && <div aria-hidden className="h-2 w-full bg-white" />}

        {!organizerArea && (
          <div className="mt-1 flex items-center justify-between gap-2">
            <Link
              href="/"
              className="flex min-w-0 items-center gap-1.5"
              aria-label="MachiGlyph ホームへ"
            >
              <Image
                src={authArea ? "/brand/machiglyph_icon.svg" : "/brand/machiglyph_icon_192.png"}
                alt=""
                width={authArea ? 28 : 22}
                height={authArea ? 28 : 22}
                className={cn(
                  "shrink-0",
                  authArea ? "h-7 w-7" : "h-[22px] w-[22px] rounded-full"
                )}
              />
              <span
                className="truncate text-[15px] font-semibold tracking-[-0.02em] text-[#163828]"
                style={{ fontFamily: "var(--font-serif-display)" }}
              >
                MachiGlyph
              </span>
            </Link>

            <div className="flex shrink-0 items-center justify-end gap-1">
              <Link
                href="/pass"
                className="flex h-8 items-center gap-1 rounded-full border border-[#dde9e1] bg-white px-2 text-[11px] font-medium text-[#163828] active:bg-[#f7fbf8]"
                aria-label="参加パス"
              >
                <ParticipationPassIcon className="h-4 w-4 shrink-0" stroke="#2f6b4f" />
                <span className="whitespace-nowrap">参加パス</span>
              </Link>

              <Suspense fallback={null}>
                <NotificationBell className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#dde9e1] bg-white text-[#163828] active:bg-[#f7fbf8] hover:bg-white hover:text-[#163828]" />
              </Suspense>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
