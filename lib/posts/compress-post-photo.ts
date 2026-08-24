import { POST_PHOTO_UPLOAD_MAX_BYTES } from "@/lib/posts/post-photos";

const MAX_EDGE = 1920;
const QUALITIES = [0.82, 0.74, 0.66, 0.58];

function fileFromBlob(blob: Blob, originalName: string): File {
  const base = originalName.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}

function drawToCanvas(
  bitmap: ImageBitmap,
  scale: number,
): HTMLCanvasElement | null {
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas;
}

function canvasToJpeg(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
  });
}

/**
 * Vercel のリクエスト上限（約4.5MB）に収まるよう、必要なら JPEG に縮小する。
 * すでに小さいファイルはそのまま返す。
 */
export async function compressPostPhoto(file: File): Promise<File> {
  if (file.size <= POST_PHOTO_UPLOAD_MAX_BYTES) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(
      "写真を読み込めませんでした。JPEG / PNG / WebP で選び直してください",
    );
  }

  try {
    const fit = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const scales = fit < 1 ? [fit, fit * 0.75, fit * 0.55] : [1, 0.75, 0.55];

    for (const scale of scales) {
      const canvas = drawToCanvas(bitmap, scale);
      if (!canvas) continue;
      for (const quality of QUALITIES) {
        const blob = await canvasToJpeg(canvas, quality);
        if (blob && blob.size <= POST_PHOTO_UPLOAD_MAX_BYTES) {
          return fileFromBlob(blob, file.name);
        }
      }
    }
  } finally {
    bitmap.close();
  }

  throw new Error(
    "写真が大きすぎて送れません。解像度を下げるか、別の写真を選んでください",
  );
}
