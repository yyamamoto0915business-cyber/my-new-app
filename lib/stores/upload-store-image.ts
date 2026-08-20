import { isAbortLikeError } from "@/lib/is-abort-like-error";

export type StoreImageKind = "cover" | "gallery" | "news" | "menu";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const MAX_BYTES = 10 * 1024 * 1024;

export function storageErrorMessage(err: unknown): string {
  if (isAbortLikeError(err)) {
    return "アップロードが中断されました。もう一度お試しください";
  }
  if (typeof err === "object" && err && "message" in err) {
    const msg = String((err as { message: unknown }).message ?? "");
    if (/row-level security|JWT|not authenticated|Unauthorized/i.test(msg)) {
      return "ログインの有効期限が切れている可能性があります。再ログイン後にお試しください";
    }
    if (/payload too large|maximum|exceeded|too large/i.test(msg)) {
      return "ファイルサイズが大きすぎます（10MBまで）";
    }
    if (/mime|invalid|not supported|content type/i.test(msg)) {
      return "対応していないファイル形式です（JPEG・PNG・GIF・WebP のみ）";
    }
    if (msg) return msg;
  }
  if (err instanceof Error && err.message) return err.message;
  return "画像のアップロードに失敗しました";
}

/** 開発オーバーレイを汚さないよう、中断系は warn に留める */
export function logStoreUploadError(context: string, err: unknown): void {
  if (isAbortLikeError(err)) {
    console.warn(`${context}:`, storageErrorMessage(err));
    return;
  }
  console.error(`${context}:`, err);
}

function mimeFromName(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
  };
  return map[ext] ?? "";
}

function resolveContentType(file: File): string {
  const raw = file.type === "image/jpg" ? "image/jpeg" : file.type;
  if (ALLOWED_MIME.has(raw) || ALLOWED_MIME.has(file.type)) {
    return raw === "image/jpg" ? "image/jpeg" : raw || "image/jpeg";
  }
  return mimeFromName(file.name);
}

async function tryConvertToJpeg(file: File): Promise<File | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9),
    );
    if (!blob) return null;
    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } catch {
    return null;
  }
}

/** MIME / 拡張子を整え、必要なら JPEG に変換する */
export async function prepareStoreImageFile(file: File): Promise<File> {
  if (file.size > MAX_BYTES) {
    throw new Error("ファイルサイズが大きすぎます（10MBまで）");
  }

  const contentType = resolveContentType(file);
  if (contentType && ALLOWED_MIME.has(contentType)) {
    const normalized = contentType === "image/jpg" ? "image/jpeg" : contentType;
    if (file.type === normalized) return file;
    return new File([file], file.name, { type: normalized });
  }

  const converted = await tryConvertToJpeg(file);
  if (converted) return converted;

  throw new Error(
    "対応していないファイル形式です（JPEG・PNG・GIF・WebP のみ。iPhoneの写真は「互換性のあるフォーマット」で選んでください）",
  );
}

async function postStoreImageOnce(
  storeId: string,
  kind: StoreImageKind,
  file: File,
): Promise<string> {
  const body = new FormData();
  body.append("file", file, file.name);
  body.append("kind", kind);

  const res = await fetch(`/api/organizer/stores/${storeId}/images`, {
    method: "POST",
    body,
    credentials: "same-origin",
    cache: "no-store",
  });

  const json = (await res.json().catch(() => ({}))) as {
    url?: string;
    error?: string;
  };

  if (!res.ok) {
    throw new Error(json.error ?? "画像のアップロードに失敗しました");
  }
  if (!json.url) {
    throw new Error("公開URLの取得に失敗しました");
  }
  return json.url;
}

/**
 * 店舗画像をサーバー経由で Storage にアップロードし、公開 URL を返す。
 * ブラウザの Supabase セッション不整合を避けるため API に委譲する。
 */
export async function uploadStoreImageFile(opts: {
  file: File;
  kind: StoreImageKind;
  storeId: string;
}): Promise<string> {
  const prepared = await prepareStoreImageFile(opts.file);

  try {
    return await postStoreImageOnce(opts.storeId, opts.kind, prepared);
  } catch (err) {
    // 開発時の HMR や一時的な中断なら 1 回だけ再試行
    if (!isAbortLikeError(err)) throw err;
    await new Promise((r) => setTimeout(r, 250));
    return postStoreImageOnce(opts.storeId, opts.kind, prepared);
  }
}
