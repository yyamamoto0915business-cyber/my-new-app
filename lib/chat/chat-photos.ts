import type { SupabaseClient } from "@supabase/supabase-js";

/** チャットの写真を置く非公開の置き場 */
export const CHAT_MEDIA_BUCKET = "chat-media";
/** 写真の大きさの上限。Vercel は1回に 4.5MB までしか受けとれないので 4MB（送る前にブラウザで小さくする） */
export const CHAT_PHOTO_MAX_BYTES = 4 * 1024 * 1024;
/** 写真だけを送ったときに、一覧のプレビューや通知に出す文字 */
export const CHAT_PHOTO_DEFAULT_TEXT = "写真を送りました";
/** 見るための URL の期限（秒） */
const SIGNED_URL_TTL = 60 * 60;

export const CHAT_PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type WithImagePath = { image_path?: string | null };

/**
 * 写真のメッセージに、期限つきの URL（image_url）をつける。
 * 呼ぶ前に、見る人が会話の参加者であることを確かめておくこと。
 */
export async function attachChatPhotoUrls<T extends WithImagePath>(
  admin: SupabaseClient | null,
  rows: T[],
): Promise<(T & { image_url: string | null })[]> {
  const paths = [...new Set(rows.map((r) => r.image_path).filter((p): p is string => !!p))];
  const urlByPath = new Map<string, string>();
  if (admin && paths.length > 0) {
    const { data, error } = await admin.storage.from(CHAT_MEDIA_BUCKET).createSignedUrls(paths, SIGNED_URL_TTL);
    if (error) console.error("[chat-photos] sign failed", error.message);
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) urlByPath.set(item.path, item.signedUrl);
    }
  }
  return rows.map((r) => ({ ...r, image_url: r.image_path ? (urlByPath.get(r.image_path) ?? null) : null }));
}
