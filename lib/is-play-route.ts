/** 参加者が遊ぶ画面 `/play` と `/play/spot`。 */
export function isPlayRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === "/play" || pathname.startsWith("/play/");
}
