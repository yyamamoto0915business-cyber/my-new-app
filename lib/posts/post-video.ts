/** 投稿動画の最大秒数 */
export const POST_VIDEO_MAX_DURATION_SEC = 60;

/** 選択時のファイルサイズ上限。送信前に縮小する */
export const POST_VIDEO_MAX_BYTES = 80 * 1024 * 1024;

/** アップロード本体の目標サイズ。Vercel の約4.5MB制限に余裕を持たせる */
export const POST_VIDEO_UPLOAD_MAX_BYTES = 3.5 * 1024 * 1024;

/** サーバーが受け付ける上限（圧縮の誤差を許容） */
export const POST_VIDEO_UPLOAD_SERVER_MAX_BYTES = 4 * 1024 * 1024;

export const POST_VIDEO_ACCEPT = "video/mp4,video/webm,video/quicktime,video/*";

const ACCEPTED_MIME_PREFIXES = ["video/"];

export function isAcceptedVideoMime(type: string): boolean {
  return ACCEPTED_MIME_PREFIXES.some((p) => type.startsWith(p));
}

export function formatVideoDuration(seconds: number): string {
  const sec = Math.max(0, Math.round(seconds));
  const mins = Math.floor(sec / 60);
  const rest = sec % 60;
  return `${mins}:${rest.toString().padStart(2, "0")}`;
}

export function isVideoDurationValid(durationSec: number): boolean {
  return durationSec > 0 && durationSec <= POST_VIDEO_MAX_DURATION_SEC + 0.25;
}

/** ファイルから動画の長さ（秒）を取得 */
export function getVideoDurationFromFile(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const url = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("動画の読み込みに失敗しました"));
    };
    video.src = url;
  });
}

/** Blob URL から動画の長さ（秒）を取得 */
export function getVideoDurationFromUrl(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => resolve(video.duration);
    video.onerror = () => reject(new Error("動画の読み込みに失敗しました"));
    video.src = url;
  });
}

export function pickMediaRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t));
}

export async function validateVideoFile(file: File): Promise<number> {
  if (!isAcceptedVideoMime(file.type)) {
    throw new Error("対応している動画形式（MP4 / WebM など）を選んでください");
  }
  if (file.size > POST_VIDEO_MAX_BYTES) {
    throw new Error("動画サイズは80MB以内にしてください");
  }
  const duration = await getVideoDurationFromFile(file);
  if (!isVideoDurationValid(duration)) {
    throw new Error(
      `動画は${POST_VIDEO_MAX_DURATION_SEC}秒以内にしてください（現在 ${formatVideoDuration(duration)}）`,
    );
  }
  return duration;
}
