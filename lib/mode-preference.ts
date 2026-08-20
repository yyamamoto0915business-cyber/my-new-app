/** モード選択の保存（cookie。未ログインでも有効）
 * EVENT=まちの情報 / VOLUNTEER=みんなの投稿（後方互換のキー名） / ORGANIZER=主催
 */

export type ModePreference = "EVENT" | "VOLUNTEER" | "ORGANIZER" | null;

/** 最初のページ（モード選択）へのURL。クッキーを無視して戻れる */
export const MODE_SELECT_URL = "/?mode=select";

const COOKIE_NAME = "app_mode";

export function getModeFromCookie(): ModePreference {
  if (typeof document === "undefined") return null;
  const m = document.cookie
    .split("; ")
    .find((r) => r.startsWith(`${COOKIE_NAME}=`))
    ?.split("=")[1];
  if (m === "EVENT" || m === "VOLUNTEER" || m === "ORGANIZER") return m;
  return null;
}

export function setModeCookie(mode: ModePreference): void {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 365; // 1年
  if (mode) {
    document.cookie = `${COOKIE_NAME}=${mode}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } else {
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
  }
}

export function getRedirectPathForMode(mode: ModePreference): string {
  switch (mode) {
    case "EVENT":
      return "/";
    case "VOLUNTEER":
      return "/posts";
    case "ORGANIZER":
      return "/organizer/listings";
    default:
      return "/";
  }
}
