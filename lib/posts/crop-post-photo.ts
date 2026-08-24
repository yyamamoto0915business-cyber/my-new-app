import {
  POST_PHOTO_ASPECT_RATIO,
  POST_PHOTO_CROP_MAX_WIDTH,
} from "@/lib/posts/post-photos";

export const POST_PHOTO_CROP_MIN_ZOOM = 1;
export const POST_PHOTO_CROP_MAX_ZOOM = 3;

export type PhotoCropTransform = {
  zoom: number;
  panX: number;
  panY: number;
};

export async function loadPhotoBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, {
      imageOrientation: "from-image",
    } as ImageBitmapOptions);
  } catch {
    return await createImageBitmap(file);
  }
}

export function coverScale(
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number,
): number {
  if (imageWidth <= 0 || imageHeight <= 0) return 1;
  return Math.max(viewportWidth / imageWidth, viewportHeight / imageHeight);
}

export function clampPhotoCropTransform(
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  transform: PhotoCropTransform,
): PhotoCropTransform {
  const zoom = Math.min(
    POST_PHOTO_CROP_MAX_ZOOM,
    Math.max(POST_PHOTO_CROP_MIN_ZOOM, transform.zoom),
  );
  const scale = coverScale(imageWidth, imageHeight, viewportWidth, viewportHeight) * zoom;
  const drawnW = imageWidth * scale;
  const drawnH = imageHeight * scale;
  const maxPanX = Math.max(0, (drawnW - viewportWidth) / 2);
  const maxPanY = Math.max(0, (drawnH - viewportHeight) / 2);
  return {
    zoom,
    panX: Math.min(maxPanX, Math.max(-maxPanX, transform.panX)),
    panY: Math.min(maxPanY, Math.max(-maxPanY, transform.panY)),
  };
}

export function photoCropDrawRect(
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  transform: PhotoCropTransform,
): { left: number; top: number; width: number; height: number } {
  const clamped = clampPhotoCropTransform(
    imageWidth,
    imageHeight,
    viewportWidth,
    viewportHeight,
    transform,
  );
  const scale =
    coverScale(imageWidth, imageHeight, viewportWidth, viewportHeight) * clamped.zoom;
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return {
    left: (viewportWidth - width) / 2 + clamped.panX,
    top: (viewportHeight - height) / 2 + clamped.panY,
    width,
    height,
  };
}

function even(n: number): number {
  return Math.max(2, Math.round(n / 2) * 2);
}

export async function cropPostPhoto(
  bitmap: ImageBitmap,
  transform: PhotoCropTransform,
  viewportWidth: number,
  viewportHeight: number,
  originalName: string,
): Promise<File> {
  const vw = Math.max(1, viewportWidth);
  const vh = Math.max(1, viewportHeight);
  const clamped = clampPhotoCropTransform(
    bitmap.width,
    bitmap.height,
    vw,
    vh,
    transform,
  );
  const scale =
    coverScale(bitmap.width, bitmap.height, vw, vh) * clamped.zoom;
  const sx = (-((vw - bitmap.width * scale) / 2 + clamped.panX)) / scale;
  const sy = (-((vh - bitmap.height * scale) / 2 + clamped.panY)) / scale;
  const sw = vw / scale;
  const sh = vh / scale;

  let outW = even(Math.min(POST_PHOTO_CROP_MAX_WIDTH, sw));
  let outH = even(outW / POST_PHOTO_ASPECT_RATIO);
  if (outH > (POST_PHOTO_CROP_MAX_WIDTH / POST_PHOTO_ASPECT_RATIO)) {
    outH = even(POST_PHOTO_CROP_MAX_WIDTH / POST_PHOTO_ASPECT_RATIO);
    outW = even(outH * POST_PHOTO_ASPECT_RATIO);
  }

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("写真を切り抜けませんでした");
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, outW, outH);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((next) => resolve(next), "image/jpeg", 0.88);
  });
  if (!blob) {
    throw new Error("写真を切り抜けませんでした");
  }
  const base = originalName.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}
