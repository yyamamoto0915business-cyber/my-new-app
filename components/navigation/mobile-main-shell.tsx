"use client";

import type { CSSProperties, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { getMobileTopHeaderHeightPx } from "@/components/navigation/mobile-top-header";
import { isEventDetailRoute } from "@/lib/is-event-detail-route";
import { isMessagesConversationRoute } from "@/lib/is-messages-conversation-route";
import { isProfileEditRoute } from "@/lib/is-profile-edit-route";
import { isAuthRoute } from "@/lib/is-auth-route";

type Props = {
  children: ReactNode;
};

/**
 * モバイル時のメイン領域の上余白を調整する。
 * MobileTopHeader は position:sticky のため文書フロー上でスペースを占有する。
 * pt は不要（二重オフセットになるため削除）。--mg-mobile-top-header-h はサブヘッダーの
 * sticky 位置決めに使用するため引き続き設定する。
 */
export function MobileMainShell({ children }: Props) {
  const pathname = usePathname();
  const eventDetail = isEventDetailRoute(pathname ?? "");
  const chatConversation = isMessagesConversationRoute(pathname ?? "");
  /** モバイルでグローバル上・下を外し、画面専用UIに任せる */
  const profileEdit = isProfileEditRoute(pathname ?? "");
  const immersiveMobile = eventDetail || chatConversation || profileEdit;
  const topHeaderH = getMobileTopHeaderHeightPx(pathname ?? "");
  const organizerArea = pathname?.startsWith("/organizer") ?? false;
  const authRoute = isAuthRoute(pathname ?? "");

  const pcTopPad = organizerArea || authRoute
    ? "min-[900px]:pt-0"
    : "min-[900px]:pt-[var(--mg-pc-top-nav-h)]";

  // auth のみ PC でフルブリード（ページ側で left-20 を扱う）。
  // プロフィール編集など immersive も PC ではサイドバー幅分の余白が必要。
  const sidePad = authRoute
    ? "min-[900px]:pl-0 max-[899px]:bg-transparent"
    : immersiveMobile
      ? "min-[900px]:pl-20 max-[899px]:bg-transparent"
      : "min-[900px]:pl-20";

  // プロフィール編集: グローバル上下ナビを外し画面専用UI。
  // h-dvh +（PCのみ）pt(トップナビ) で border-box により可視領域いっぱいに収める。
  const mobileShellLayoutClass = immersiveMobile
    ? profileEdit
      ? "flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden pt-0 pb-0 min-[900px]:pb-0"
      : "flex min-h-screen flex-col pt-0 pb-0 min-[900px]:pb-0"
    : authRoute
      ? "flex h-[100dvh] min-h-0 flex-col overflow-hidden max-[899px]:pb-0 min-[900px]:pb-0"
      : "flex min-h-screen flex-col max-[899px]:pb-[calc(88px+env(safe-area-inset-bottom,0px))] min-[900px]:pb-0";

  return (
    <div
      className={`${mobileShellLayoutClass} ${sidePad} ${pcTopPad}`}
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
