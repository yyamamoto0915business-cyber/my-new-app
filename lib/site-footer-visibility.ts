import { isMessagesConversationRoute } from "@/lib/is-messages-conversation-route";

export type SiteFooterVisibility = "hidden" | "desktop-only" | "all";

/**
 * サイト共通フッター（利用規約・プライバシー等）の表示方針。
 * - hidden: 没入型・ワークスペース画面（主催者・認証・参加パス等）
 * - desktop-only: 下部ナビと競合しやすい画面（メッセージ・チェックイン）
 * - all: 一般公開ページ（モバイル・PC 両方）
 */
export function getSiteFooterVisibility(pathname: string): SiteFooterVisibility {
  if (!pathname) return "all";

  if (isMessagesConversationRoute(pathname)) return "hidden";
  if (pathname.startsWith("/profile/edit")) return "hidden";
  if (pathname === "/auth" || pathname.startsWith("/auth/")) return "hidden";
  if (pathname === "/organizer" || pathname.startsWith("/organizer/")) {
    return "hidden";
  }
  if (pathname === "/pass" || pathname.startsWith("/pass/")) return "hidden";
  // マイページは画面内専用フッターがあるため重複を避ける
  if (pathname === "/profile") return "hidden";
  // 応募フォームは画面内完結のためフッター非表示
  if (pathname === "/application-form-preview") return "hidden";
  if (pathname === "/applications-confirm-preview") return "hidden";
  if (pathname === "/gallery-images-preview") return "hidden";
  if (pathname.includes("/application-form")) return "hidden";

  if (pathname.startsWith("/messages")) return "desktop-only";
  if (pathname.startsWith("/checkin")) return "desktop-only";

  return "all";
}
