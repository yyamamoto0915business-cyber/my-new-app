import type { ModePreference } from "@/lib/mode-preference";

/** 上部モードタブ: まちの情報｜みんなの投稿｜主催 */
export type TopModeTabId = "event" | "machi" | "organizer";

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
 * 「みんなの投稿」モード配下のパス
 */
export function isMachiModePath(pathname: string): boolean {
  return pathname === "/posts" || pathname.startsWith("/posts/");
}

/**
 * 「まちの情報」モード配下のパス（主催・投稿モード・参加パス一覧を除く）
 */
export function isEventModePath(pathname: string): boolean {
  if (isOrganizerDashboardPath(pathname)) return false;
  if (isMachiModePath(pathname)) return false;
  if (pathname.startsWith("/pass") || pathname.startsWith("/stories")) {
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
    pathname.startsWith("/organizers") ||
    pathname.startsWith("/volunteer") ||
    pathname.startsWith("/stores") ||
    pathname.startsWith("/kitchen-cars") ||
    pathname === "/machi" ||
    pathname.startsWith("/machi/")
  );
}

/** @deprecated isEventModePath を使用 */
export function isDiscoverPath(pathname: string): boolean {
  return isEventModePath(pathname);
}

/** 未ログイン時、リロードでタイトル画面へ戻すモード */
export function isGuestSplashReturnPath(pathname: string): boolean {
  // 見た目確認用プレビューはスプラッシュを出さない
  if (pathname.startsWith("/events/apply-confirm-preview")) return false;
  if (pathname.startsWith("/notifications/preview")) return false;
  if (pathname === "/" || pathname.startsWith("/events")) return true;
  if (pathname.startsWith("/stories")) return true;
  if (pathname.startsWith("/volunteer")) return true;
  if (pathname.startsWith("/stores")) return true;
  if (pathname.startsWith("/kitchen-cars")) return true;
  if (pathname === "/machi" || pathname.startsWith("/machi/")) return true;
  if (pathname === "/posts" || pathname.startsWith("/posts/")) return true;
  return false;
}

/**
 * パス名と戻り先から、上部モードタブの選択状態を決める。
 * /auth?next=/organizer のように認証画面へ飛んだ場合も「主催」を選ぶ。
 */
export function getTopModeTabIdFromContext(
  pathname: string,
  returnPath?: string | null,
  modeFromCookie: ModePreference | null = null
): TopModeTabId {
  if (isOrganizerDashboardPath(pathname)) return "organizer";
  if (isMachiModePath(pathname)) return "machi";

  const authLike =
    pathname === "/auth" ||
    pathname.startsWith("/auth/") ||
    pathname === "/onboarding";

  if (authLike) {
    if (returnPath && isOrganizerDashboardPath(returnPath)) return "organizer";
    if (returnPath && isMachiModePath(returnPath)) return "machi";
    return "event";
  }

  void modeFromCookie;
  return "event";
}
