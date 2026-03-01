/**
 * 認証関連ユーティリティ
 */

/** 認証必須のパスかどうか */
function isAuthRequiredPath(path: string): boolean {
  if (path === "/profile" || path.startsWith("/profile/")) return true;
  if (path.startsWith("/organizer")) return true;
  if (path.startsWith("/event-requests")) return true;
  if (path.startsWith("/dm")) return true;
  if (path === "/points" || path.startsWith("/points/")) return true;
  if (path === "/report/new") return true;
  if (path === "/notifications" || path.startsWith("/notifications/")) return true;
  // /events/[id]/chat などのチャットページ
  if (/^\/events\/[^/]+\/chat(\/|$)/.test(path)) return true;
  return false;
}

/**
 * 指定パスが認証必須かどうか
 */
export function requiresAuth(path: string): boolean {
  return isAuthRequiredPath(path);
}

/**
 * ログイン誘導URLを生成（returnTo付き）
 */
export function getLoginUrl(returnTo?: string): string {
  if (!returnTo || returnTo === "/login" || returnTo.startsWith("/login?")) {
    return "/login";
  }
  return `/login?returnTo=${encodeURIComponent(returnTo)}`;
}
