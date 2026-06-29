"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Bookmark } from "lucide-react";
import { TopModeTabs, type TopModeTabId } from "@/components/navigation/top-mode-tabs";
import { setModeCookie } from "@/lib/mode-preference";
import { NotificationBell } from "@/components/notification-bell";
import { cn } from "@/lib/utils";
import { isOrganizerDashboardPath } from "@/lib/top-mode-active";
import { isEventDetailRoute } from "@/lib/is-event-detail-route";
import { isMessagesConversationRoute } from "@/lib/is-messages-conversation-route";

/** 通常時（探す・ボランティア中心）のモバイル上部の目安高さ（safe-area 除く） */
export const MOBILE_TOP_HEADER_HEIGHT_PX = 118;

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

  const handleTabClick = (id: TopModeTabId) => {
    const mode =
      id === "organizer" ? "ORGANIZER" : id === "volunteer" ? "VOLUNTEER" : "EVENT";
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
    isMessagesConversationRoute(pathname ?? "")
  ) {
    return null;
  }

  return (
    <header
      ref={headerRef}
      className={cn(
        "sticky top-0 sm:hidden",
        organizerArea
          ? "z-40 bg-white pt-[env(safe-area-inset-top,0px)] pb-0 shadow-[0_1px_0_rgba(15,23,42,0.06)]"
          : "z-30 bg-[#f3f4f1] pb-1.5 pt-[env(safe-area-inset-top,0px)]",
        className
      )}
      aria-label="MachiGlyph 上部ヘッダー"
    >
      <div className="w-full px-2.5">
        <div className={organizerArea ? "mt-0.5 pb-1.5" : "mt-1"}>
          <TopModeTabs
            compact={organizerArea}
            emphasizeOrganizerActive={organizerArea}
            onTabClick={handleTabClick}
          />
        </div>

        {organizerArea && <div aria-hidden className="h-2 w-full bg-white" />}

        {!organizerArea && (
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <Link
              href="/"
              className="flex min-w-0 items-center gap-1.5"
              aria-label="MachiGlyph ホームへ"
            >
              <Image
                src="/brand/machiglyph_icon_192.png"
                alt=""
                width={24}
                height={24}
                className="h-6 w-6 shrink-0 rounded-full"
              />
              <span
                className="truncate text-[16px] font-semibold tracking-[-0.02em] text-[#1a2e22]"
                style={{ fontFamily: "'Shippori Mincho', 'Noto Serif JP', serif" }}
              >
                MachiGlyph
              </span>
            </Link>

            <div className="flex shrink-0 items-center justify-end gap-1.5">
              <Link
                href="/stories"
                className="flex h-9 items-center gap-1 rounded-full border border-[#e3e8e4] bg-white px-2.5 text-[12px] font-medium text-[#3d5c48] shadow-sm active:bg-[#fafaf8]"
                aria-label="ストーリー"
              >
                <Bookmark className="h-3.5 w-3.5 shrink-0 text-[#6a9080]" aria-hidden />
                <span className="whitespace-nowrap">ストーリー</span>
              </Link>

              <Suspense fallback={null}>
                <NotificationBell className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e3e8e4] bg-white text-[#3d5c48] shadow-sm active:bg-[#fafaf8] hover:bg-white hover:text-[#1a2e22]" />
              </Suspense>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
