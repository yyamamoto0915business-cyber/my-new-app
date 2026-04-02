"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Bookmark, BookOpenText } from "lucide-react";
import { TopModeTabs } from "@/components/navigation/top-mode-tabs";
import { NotificationBell } from "@/components/notification-bell";
import { cn } from "@/lib/utils";
import { isEventDetailRoute } from "@/lib/is-event-detail-route";

export const MOBILE_TOP_HEADER_HEIGHT_PX = 132;

type Props = {
  className?: string;
};

export function MobileTopHeader({ className }: Props) {
  const pathname = usePathname();
  if (isEventDetailRoute(pathname ?? "")) {
    return null;
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-30 sm:hidden",
        "bg-gradient-to-b from-white/92 to-transparent backdrop-blur-md",
        "pt-[env(safe-area-inset-top,0px)] pb-2",
        className
      )}
      aria-label="MachiGlyph 上部ヘッダー"
    >
      <div className="mx-auto w-full max-w-screen-sm px-0">
        <div className="mx-4 mt-1.5">
          <TopModeTabs />
        </div>

        <div className="mx-4 mt-2">
          <div className="rounded-[22px] border border-slate-200 bg-white/85 px-3 py-2 shadow-[0_1px_0_rgba(15,23,42,0.03)] backdrop-blur supports-[backdrop-filter]:bg-white/75">
            <div className="flex items-center justify-between gap-2">
              <Link
                href="/"
                className="min-w-0 font-serif text-[15px] font-semibold tracking-[-0.01em] text-slate-900"
                aria-label="MachiGlyph ホームへ"
              >
                <span className="block truncate">MachiGlyph</span>
              </Link>

              <div className="flex shrink-0 items-center justify-end gap-2">
                <Link
                  href="/saved"
                  className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-700 transition-colors active:bg-slate-100"
                  aria-label="保存したイベント"
                >
                  <Bookmark className="h-5 w-5" aria-hidden />
                </Link>

                <Link
                  href="/stories"
                  className="flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 text-sm font-semibold text-slate-700 transition-colors active:bg-slate-100"
                  aria-label="ストーリー"
                >
                  <BookOpenText className="h-5 w-5 shrink-0" aria-hidden />
                  <span className="whitespace-nowrap">ストーリー</span>
                </Link>

                <Suspense fallback={null}>
                  <NotificationBell className="border border-slate-200 bg-white/80 text-slate-700 active:bg-slate-100 hover:bg-white/80 hover:text-slate-900 dark:text-slate-200" />
                </Suspense>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

