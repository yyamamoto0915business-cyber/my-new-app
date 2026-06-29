/** 認証フロー専用画面（グローバルナビを隠す） */
export function isAuthRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === "/auth" || pathname.startsWith("/auth/");
}
