"use client";

import type { CSSProperties, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MOBILE_TOP_HEADER_HEIGHT_PX } from "@/components/navigation/mobile-top-header";
import { isEventDetailRoute } from "@/lib/is-event-detail-route";

type Props = {
  children: ReactNode;
};

/**
 * モバイル時のメイン領域の上余白を調整する。
 * イベント詳細ではグローバル上部（`MobileTopHeader`）を非表示にし、
 * safe-area は `EventDetailTabs` 内の sticky ヘッダー側で確保する。
 */
export function MobileMainShell({ children }: Props) {
  const pathname = usePathname();
  const eventDetail = isEventDetailRoute(pathname ?? "");

  return (
    <div
      className={
        eventDetail
          ? "flex min-h-screen flex-col pt-0 pb-[calc(72px+env(safe-area-inset-bottom,0px))] sm:pb-0 sm:pl-20 sm:pt-0"
          : "flex min-h-screen flex-col pt-[calc(var(--mg-mobile-top-header-h)+env(safe-area-inset-top,0px))] pb-[calc(72px+env(safe-area-inset-bottom,0px))] sm:pb-0 sm:pl-20 sm:pt-0"
      }
      style={
        eventDetail
          ? undefined
          : ({
              "--mg-mobile-top-header-h": `${MOBILE_TOP_HEADER_HEIGHT_PX}px`,
            } as CSSProperties)
      }
    >
      {children}
    </div>
  );
}
