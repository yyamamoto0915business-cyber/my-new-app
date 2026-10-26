/** みんなの投稿の詳細（/posts/[id]）。/posts/new は含まない */
export function isPostDetailRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const m = /^\/posts\/([^/]+)$/.exec(pathname);
  return Boolean(m && m[1] !== "new");
}
