/** 追加ギャラリー画像の上限（代表画像とは別） */
export const MAX_GALLERY_IMAGES = 5;

/** DB / API から来た値を正規化（空文字除去・上限） */
export function normalizeGalleryImages(value: unknown, max = MAX_GALLERY_IMAGES): string[] {
  if (!Array.isArray(value)) return [];
  const urls = value
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of urls) {
    if (seen.has(url)) continue;
    seen.add(url);
    out.push(url);
    if (out.length >= max) break;
  }
  return out;
}

/** 詳細表示用: 代表画像 + ギャラリー（重複除去） */
export function buildDetailImageList(
  coverUrl: string | null | undefined,
  galleryImages?: string[] | null
): string[] {
  const cover = coverUrl?.trim() || "";
  const gallery = normalizeGalleryImages(galleryImages ?? []);
  const seen = new Set<string>();
  const out: string[] = [];
  if (cover) {
    seen.add(cover);
    out.push(cover);
  }
  for (const url of gallery) {
    if (seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}
