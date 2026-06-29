"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { isMessagesConversationRoute } from "@/lib/is-messages-conversation-route";

/** 会話詳細・メッセージ一覧などフルスクリーンに近い画面ではフッターを出さず本文領域を確保する */
export function ImmersiveAwareFooter() {
  const pathname = usePathname();
  if (isMessagesConversationRoute(pathname ?? "")) return null;
  if (pathname?.startsWith("/profile/edit")) return null;
  if (pathname?.startsWith("/messages")) {
    return (
      <div className="hidden sm:block">
        <SiteFooter />
      </div>
    );
  }
  // ホームはモックアップ準拠でフッターを非表示
  if (pathname === "/") return null;
  if (pathname === "/auth" || pathname?.startsWith("/auth/")) return null;
  return (
    <div className="sm:block">
      <SiteFooter />
    </div>
  );
}
