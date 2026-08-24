"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import {
  clampPhotoCropTransform,
  cropPostPhoto,
  loadPhotoBitmap,
  photoCropDrawRect,
  POST_PHOTO_CROP_MAX_ZOOM,
  POST_PHOTO_CROP_MIN_ZOOM,
  type PhotoCropTransform,
} from "@/lib/posts/crop-post-photo";
import { POST_PHOTO_ASPECT_RATIO } from "@/lib/posts/post-photos";

type Props = {
  file: File;
  index: number;
  total: number;
  onConfirm: (file: File) => void;
  onCancel: () => void;
};

const DEFAULT_TRANSFORM: PhotoCropTransform = { zoom: 1, panX: 0, panY: 0 };

export function PostPhotoCropSheet({
  file,
  index,
  total,
  onConfirm,
  onCancel,
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchStartRef = useRef<{ distance: number; zoom: number } | null>(null);
  const transformRef = useRef<PhotoCropTransform>(DEFAULT_TRANSFORM);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [transform, setTransform] = useState<PhotoCropTransform>(DEFAULT_TRANSFORM);
  const [viewport, setViewport] = useState({ width: 320, height: 240 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);

  useEffect(() => {
    let cancelled = false;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    transformRef.current = DEFAULT_TRANSFORM;
    setTransform(DEFAULT_TRANSFORM);
    setError(null);
    setBitmap(null);
    void loadPhotoBitmap(file)
      .then((next) => {
        if (!cancelled) setBitmap(next);
      })
      .catch(() => {
        if (!cancelled) setError("写真を読み込めませんでした");
      });
    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
    };
  }, [file]);

  useEffect(() => {
    return () => {
      bitmap?.close();
    };
  }, [bitmap]);

  const measure = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const width = el.clientWidth;
    setViewport({ width, height: width / POST_PHOTO_ASPECT_RATIO });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, file]);

  const applyTransform = useCallback(
    (next: PhotoCropTransform) => {
      if (!bitmap) return;
      const clamped = clampPhotoCropTransform(
        bitmap.width,
        bitmap.height,
        viewport.width,
        viewport.height,
        next,
      );
      transformRef.current = clamped;
      setTransform(clamped);
    },
    [bitmap, viewport.height, viewport.width],
  );

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2) {
      const pts = [...pointersRef.current.values()];
      pinchStartRef.current = {
        distance: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
        zoom: transformRef.current.zoom,
      };
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const prev = pointersRef.current.get(e.pointerId);
    if (!prev) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const current = transformRef.current;

    if (pointersRef.current.size === 2 && pinchStartRef.current) {
      const pts = [...pointersRef.current.values()];
      const distance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const start = pinchStartRef.current;
      if (start.distance > 0 && distance > 0) {
        applyTransform({
          ...current,
          zoom: start.zoom * (distance / start.distance),
        });
      }
      return;
    }

    if (pointersRef.current.size === 1) {
      applyTransform({
        ...current,
        panX: current.panX + (e.clientX - prev.x),
        panY: current.panY + (e.clientY - prev.y),
      });
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchStartRef.current = null;
  }

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    e.preventDefault();
    const current = transformRef.current;
    applyTransform({
      ...current,
      zoom: current.zoom + (e.deltaY < 0 ? 0.08 : -0.08),
    });
  }

  async function handleConfirm() {
    if (!bitmap || busy) return;
    setBusy(true);
    setError(null);
    try {
      const cropped = await cropPostPhoto(
        bitmap,
        transformRef.current,
        viewport.width,
        viewport.height,
        file.name,
      );
      onConfirm(cropped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "切り抜けませんでした");
    } finally {
      setBusy(false);
    }
  }

  const draw =
    bitmap != null
      ? photoCropDrawRect(
          bitmap.width,
          bitmap.height,
          viewport.width,
          viewport.height,
          transform,
        )
      : null;

  return (
    <div
      className="posts-photo-crop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="posts-photo-crop-title"
    >
      <div className="posts-photo-crop__panel">
        <div className="posts-photo-crop__head">
          <div>
            <p id="posts-photo-crop-title" className="posts-photo-crop__title">
              見せたい部分を合わせる
            </p>
            <p className="posts-photo-crop__hint">
              一覧・詳細と同じ比率です。
              {total > 1 ? `${index + 1} / ${total}枚` : "ドラッグで位置を動かせます"}
            </p>
          </div>
          <button
            type="button"
            className="posts-photo-crop__close"
            onClick={onCancel}
            aria-label="切り抜きをやめる"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          ref={viewportRef}
          className="posts-photo-crop__viewport"
          style={{ height: viewport.height }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
        >
          {previewUrl && draw ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt=""
              draggable={false}
              className="posts-photo-crop__img"
              style={{
                width: draw.width,
                height: draw.height,
                transform: `translate(${draw.left}px, ${draw.top}px)`,
              }}
            />
          ) : (
            <p className="posts-photo-crop__loading">読み込み中…</p>
          )}
        </div>

        <label className="posts-photo-crop__zoom">
          <span>拡大</span>
          <input
            type="range"
            min={POST_PHOTO_CROP_MIN_ZOOM}
            max={POST_PHOTO_CROP_MAX_ZOOM}
            step={0.01}
            value={transform.zoom}
            onChange={(e) =>
              applyTransform({ ...transformRef.current, zoom: Number(e.target.value) })
            }
          />
        </label>

        {error ? <p className="posts-photo-crop__error">{error}</p> : null}

        <div className="posts-photo-crop__actions">
          <button type="button" className="posts-photo-crop__ghost" onClick={onCancel}>
            やめる
          </button>
          <button
            type="button"
            className="posts-photo-crop__primary"
            onClick={() => void handleConfirm()}
            disabled={!bitmap || busy}
          >
            {busy ? "整えています…" : total > 1 && index < total - 1 ? "次へ" : "完了"}
          </button>
        </div>
      </div>
    </div>
  );
}
