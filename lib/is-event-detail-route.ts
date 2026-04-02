/** イベント詳細ページ `/events/[id]` のみ。一覧・チャット等の子ページは含まない。 */
export function isEventDetailRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return /^\/events\/[^/]+$/.test(pathname);
}
