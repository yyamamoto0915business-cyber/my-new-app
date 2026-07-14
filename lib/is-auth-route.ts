/** 認証フロー専用画面 */
export function isAuthRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return (
    pathname === "/auth" ||
    pathname.startsWith("/auth/") ||
    pathname === "/signup" ||
    pathname.startsWith("/signup/") ||
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/onboarding" ||
    pathname.startsWith("/onboarding/")
  );
}

/**
 * PC グローバルナビ（上部バー・左サイドバー）を隠す画面か。
 * /auth 本体はログイン枠がナビ下に収まる前提なので表示する。
 */
export function shouldHidePcGlobalNav(
  pathname: string | null | undefined
): boolean {
  if (!pathname) return false;
  if (pathname === "/auth") return false;
  return isAuthRoute(pathname);
}
