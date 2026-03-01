/**
 * 地図上のスポット座標（viewBox 0 0 1000 600 基準）
 * 足あとの位置・向き・スケールを管理。
 * 「地図のHOMEと書かれた場所」などを見ながら x,y を微調整できる。
 */
export type SpotKey = "HOME" | "VOLUNTEER" | "EVENTS" | "PROFILE" | "MESSAGES" | "DEFAULT";

export type Spot = {
  x: number;
  y: number;
  /** 足あとの向き（度、0=右向き） */
  rotate: number;
  /** 足あとのスケール */
  scale: number;
};

/** ホーム足あとの座標（足あと道の始点として使用） */
export const HOME_SPOT = { x: 150, y: 150 } as const;

export const SPOTS: Record<SpotKey, Spot> = {
  HOME: { x: HOME_SPOT.x, y: HOME_SPOT.y, rotate: 15, scale: 1 },
  VOLUNTEER: { x: 767, y: 285, rotate: -25, scale: 1 },
  EVENTS: { x: 483, y: 240, rotate: 5, scale: 1 },
  PROFILE: { x: 167, y: 413, rotate: 20, scale: 1 },
  MESSAGES: { x: 708, y: 465, rotate: -15, scale: 1 },
  /** 未マッピングのルート用 */
  DEFAULT: { x: 500, y: 300, rotate: 0, scale: 1 },
};

/**
 * ルートパスからスポットキーを決定（前方一致・正規化）
 */
export function routeToSpotKey(pathname: string): SpotKey {
  const normalized = pathname === "/" ? "/" : pathname.replace(/\/+$/, "") || "/";
  if (normalized === "/") return "HOME";
  if (normalized.startsWith("/volunteer")) return "VOLUNTEER";
  if (normalized.startsWith("/events")) return "EVENTS";
  if (normalized.startsWith("/profile")) return "PROFILE";
  if (normalized.startsWith("/messages") || normalized.startsWith("/dm")) return "MESSAGES";
  return "DEFAULT";
}
