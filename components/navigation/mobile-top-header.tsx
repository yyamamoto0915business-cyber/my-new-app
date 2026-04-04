"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Bookmark, BookOpenText } from "lucide-react";
import { TopModeTabs } from "@/components/navigation/top-mode-tabs";
import { NotificationBell } from "@/components/notification-bell";
import { cn } from "@/lib/utils";
import { isEventDetailRoute } from "@/lib/is-event-detail-route";

/** 通常時（探す・ボランティア中心）のモバイル上部の目安高さ（safe-area 除く） */
export const MOBILE_TOP_HEADER_HEIGHT_PX = 132;

/** 主催者ルートでコンパクトヘッダーにしたときの目安高さ（safe-area 除く・サブ行は2アイコンまで） */
export const MOBILE_TOP_HEADER_HEIGHT_ORGANIZER_PX = 100;

export function getMobileTopHeaderHeightPx(pathname: string | null | undefined): number {
  if (!pathname) return MOBILE_TOP_HEADER_HEIGHT_PX;
  if (pathname.startsWith("/organizer")) return MOBILE_TOP_HEADER_HEIGHT_ORGANIZER_PX;
  return MOBILE_TOP_HEADER_HEIGHT_PX;
}

type Props = {
  className?: string;
};

export function MobileTopHeader({ className }: Props) {
  const pathname = usePathname();
  if (isEventDetailRoute(pathname ?? "")) {
    return null;
  }

  const organizerArea = pathname?.startsWith("/organizer") ?? false;

  return (
    <header
      className={cn(
        "sticky top-0 z-30 sm:hidden",
        "bg-gradient-to-b from-white/92 to-transparent backdrop-blur-md",
        organizerArea ? "pt-[env(safe-area-inset-top,0px)] pb-1.5" : "pt-[env(safe-area-inset-top,0px)] pb-2",
        className
      )}
      aria-label="MachiGlyph 上部ヘッダー"
    >
      <div className="mx-auto w-full max-w-screen-sm px-0">
        <div className={cn("mx-4", organizerArea ? "mt-0.5" : "mt-1.5")}>
          <TopModeTabs compact={organizerArea} emphasizeOrganizerActive={organizerArea} />
        </div>

        <div className={cn("mx-4", organizerArea ? "mt-1" : "mt-2")}>
          <div
            className={cn(
              "border border-slate-200 bg-white/85 shadow-[0_1px_0_rgba(15,23,42,0.03)] backdrop-blur supports-[backdrop-filter]:bg-white/75",
              organizerArea
                ? "rounded-xl px-2 py-1"
                : "rounded-[22px] px-3 py-2"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <Link
                href="/"
                className={cn(
                  "min-w-0 font-serif font-semibold tracking-[-0.01em] text-slate-900",
                  organizerArea ? "max-w-[55%] text-[12px]" : "text-[15px]"
                )}
                aria-label="MachiGlyph ホームへ"
              >
                <span className="block truncate">MachiGlyph</span>
              </Link>

              <div
                className={cn(
                  "flex shrink-0 items-center justify-end",
                  organizerArea ? "gap-1" : "gap-2"
                )}
              >
                {!organizerArea && (
                  <Link
                    href="/saved"
                    className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-700 transition-colors active:bg-slate-100"
                    aria-label="保存したイベント"
                  >
                    <Bookmark className="h-5 w-5" aria-hidden />
                  </Link>
                )}

                {organizerArea && (
                  <Link
                    href="/saved"
                    className="relative flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/90 bg-white/90 text-slate-600 transition-colors active:bg-slate-100"
                    aria-label="保存したイベント"
                  >
                    <Bookmark className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                )}

                {!organizerArea && (
                  <Link
                    href="/stories"
                    className="flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 text-sm font-semibold text-slate-700 transition-colors active:bg-slate-100"
                    aria-label="ストーリー"
                  >
                    <BookOpenText className="h-5 w-5 shrink-0" aria-hidden />
                    <span className="whitespace-nowrap">ストーリー</span>
                  </Link>
                )}

                <Suspense fallback={null}>
                  <NotificationBell
                    className={cn(
                      "flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-700 active:bg-slate-100 hover:bg-white/80 hover:text-slate-900 dark:text-slate-200",
                      organizerArea ? "h-8 w-8 [&_svg]:h-[17px] [&_svg]:w-[17px]" : "h-11 w-11"
                    )}
                  />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
