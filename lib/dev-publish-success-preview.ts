const PREVIEW_PATHS = new Set([
  "/organizer/recruitments/new",
  "/organizer/events/new",
  "/posts/new",
]);

/** 開発時のみ。公開完了カードの見た目確認クエリ */
export function isDevPreviewSuccessQuery(value: string | null | undefined): boolean {
  return process.env.NODE_ENV !== "production" && value === "1";
}

export function isDevPublishSuccessPreviewPath(
  pathname: string,
  previewSuccess: string | null,
): boolean {
  return isDevPreviewSuccessQuery(previewSuccess) && PREVIEW_PATHS.has(pathname);
}

export function hasPublicPublishTargetId(id: string | null | undefined): boolean {
  return Boolean(id && id.length > 0 && id !== "preview");
}
