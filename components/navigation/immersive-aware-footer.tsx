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
      <div className="hidden min-[900px]:block">
        <SiteFooter />
      </div>
    );
  }
  // ホームはモックアップ準拠でフッターを非表示
  if (pathname === "/") return null;
  // チェックインはモバイル下部ナビ専用画面のためフッターを出さない
  if (pathname?.startsWith("/checkin")) {
    return (
      <div className="hidden min-[900px]:block">
        <SiteFooter />
      </div>
    );
  }
  if (pathname === "/auth" || pathname?.startsWith("/auth/")) return null;
  // 主催者ワークスペースは画面内操作を優先しフッターを出さない
  if (pathname === "/organizer" || pathname?.startsWith("/organizer/")) return null;
  if (pathname === "/profile") {
    return (
      <div className="hidden min-[900px]:block">
        <SiteFooter />
      </div>
    );
  }
  return (
    <div className="hidden min-[900px]:block">
      <SiteFooter />
    </div>
  );
}
