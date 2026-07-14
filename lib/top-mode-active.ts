import type { ModePreference } from "@/lib/mode-preference";

export type TopModeTabId = "discover" | "volunteer" | "organizer";

/** 主催者ダッシュボード（/organizer/*）。公開プロフィール /organizers/* は含まない */
export function isOrganizerDashboardPath(pathname: string): boolean {
  if (pathname.startsWith("/organizers")) return false;
  return pathname === "/organizer" || pathname.startsWith("/organizer/");
}

/** 認証後の戻り先（next / returnTo など）を1本化 */
export function resolveAuthReturnPath(
  ...candidates: (string | null | undefined)[]
): string | null {
  const raw = candidates.find((v) => v != null && v !== "") ?? null;
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * パス名と戻り先から、上部モードタブの選択状態を決める。
 * /auth?next=/organizer のように認証画面へ飛んだ場合も「主催」を選ぶ。
 */
/** 「探す」モード配下のパス（主催・ボランティア・参加パス一覧を除く） */
export function isDiscoverPath(pathname: string): boolean {
  if (isOrganizerDashboardPath(pathname)) return false;
  if (pathname.startsWith("/volunteer") || pathname.startsWith("/pass") || pathname.startsWith("/stories")) {
    return false;
  }
  if (
    pathname.startsWith("/messages") ||
    pathname.startsWith("/saved") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/profile")
  ) {
    return true;
  }
  return (
    pathname === "/" ||
    pathname.startsWith("/events") ||
    pathname.startsWith("/organizers")
  );
}

/** 未ログイン時、リロードでタイトル画面へ戻すモード（探す・参加パス・ボランティア） */
export function isGuestSplashReturnPath(pathname: string): boolean {
  if (pathname === "/" || pathname.startsWith("/events")) return true;
  if (pathname.startsWith("/pass") || pathname.startsWith("/stories")) return true;
  if (pathname.startsWith("/volunteer")) return true;
  return false;
}

export function getTopModeTabIdFromContext(
  pathname: string,
  returnPath?: string | null,
  modeFromCookie: ModePreference | null = null
): TopModeTabId {
  if (isOrganizerDashboardPath(pathname)) return "organizer";
  if (pathname.startsWith("/volunteer")) return "volunteer";

  const authLike =
    pathname === "/auth" ||
    pathname.startsWith("/auth/") ||
    pathname === "/onboarding";

  if (authLike) {
    if (returnPath && isOrganizerDashboardPath(returnPath)) return "organizer";
    if (returnPath?.startsWith("/volunteer")) return "volunteer";
    return "discover";
  }

  return "discover";
}
