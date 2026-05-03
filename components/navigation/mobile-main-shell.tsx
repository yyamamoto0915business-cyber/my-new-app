"use client";

import type { CSSProperties, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { getMobileTopHeaderHeightPx } from "@/components/navigation/mobile-top-header";
import { isEventDetailRoute } from "@/lib/is-event-detail-route";
import { isMessagesConversationRoute } from "@/lib/is-messages-conversation-route";

type Props = {
  children: ReactNode;
};

/**
 * モバイル時のメイン領域の上余白を調整する。
 * イベント詳細・メッセージ会話詳細ではグローバル上部（`MobileTopHeader`）を非表示にし、
 * 下のモバイルナビ用余白も外す（各画面の専用UIで safe-area を確保）。
 */
export function MobileMainShell({ children }: Props) {
  const pathname = usePathname();
  const eventDetail = isEventDetailRoute(pathname ?? "");
  const chatConversation = isMessagesConversationRoute(pathname ?? "");
  /** モバイルでグローバル上・下を外し、画面専用UIに任せる */
  const immersiveMobile = eventDetail || chatConversation;
  const topHeaderH = getMobileTopHeaderHeightPx(pathname ?? "");

  return (
    <div
      className={
        immersiveMobile
          ? "flex min-h-screen flex-col pt-0 pb-0 sm:pb-0 sm:pl-20 min-[900px]:pl-20 min-[900px]:pt-[var(--mg-pc-top-nav-h)]"
          : "flex min-h-screen flex-col max-[639px]:pt-[calc(var(--mg-mobile-top-header-h)+env(safe-area-inset-top,0px))] max-[639px]:pb-[calc(72px+env(safe-area-inset-bottom,0px))] min-[640px]:max-[899px]:pt-0 min-[900px]:pt-[var(--mg-pc-top-nav-h)] sm:pb-0 sm:pl-20 min-[900px]:pl-20"
      }
      style={
        immersiveMobile
          ? undefined
          : ({
              "--mg-mobile-top-header-h": `${topHeaderH}px`,
            } as CSSProperties)
      }
    >
      {children}
    </div>
  );
}
