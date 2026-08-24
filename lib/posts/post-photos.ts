/** 写真投稿の最大枚数 */
export const POST_PHOTO_MAX_COUNT = 10;

/** 選択時の1枚あたり上限（10MB）。送信前に縮小する */
export const POST_PHOTO_MAX_BYTES = 10 * 1024 * 1024;

/** アップロード本体の上限。Vercel の約4.5MB制限に余裕を持たせる */
export const POST_PHOTO_UPLOAD_MAX_BYTES = 3.5 * 1024 * 1024;

/** 一覧・詳細・切り抜きで揃える比（幅 / 高さ） */
export const POST_PHOTO_ASPECT_RATIO = 4 / 3;

/** 切り抜き JPEG の長辺上限 */
export const POST_PHOTO_CROP_MAX_WIDTH = 1920;

export const POST_PHOTO_ACCEPT =
  "image/jpeg,image/png,image/webp,image/*";

const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function isAcceptedPhotoMime(type: string): boolean {
  return ACCEPTED_IMAGE_TYPES.has(type.toLowerCase());
}

export function validatePhotoFiles(
  files: File[],
  existingCount = 0,
): { ok: true; files: File[] } | { ok: false; error: string } {
  if (!files.length) {
    return { ok: false, error: "写真を選んでください" };
  }
  const remaining = POST_PHOTO_MAX_COUNT - existingCount;
  if (remaining <= 0) {
    return {
      ok: false,
      error: `写真は最大${POST_PHOTO_MAX_COUNT}枚までです`,
    };
  }
  const picked = files.slice(0, remaining);
  for (const file of picked) {
    if (!isAcceptedPhotoMime(file.type)) {
      return {
        ok: false,
        error: "JPEG / PNG / WebP の写真を選んでください",
      };
    }
    if (file.size > POST_PHOTO_MAX_BYTES) {
      return {
        ok: false,
        error: "各写真は10MB以内にしてください",
      };
    }
  }
  return { ok: true, files: picked };
}
