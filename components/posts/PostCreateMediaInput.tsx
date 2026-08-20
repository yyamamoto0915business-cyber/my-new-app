"use client";

import { useRef, useState } from "react";
import { Camera, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  POST_PHOTO_MAX_COUNT,
  validatePhotoFiles,
} from "@/lib/posts/post-photos";
import {
  formatVideoDuration,
  validateVideoFile,
} from "@/lib/posts/post-video";

type Props = {
  imagePreviewUrls: string[];
  videoPreviewUrl: string | null;
  videoDurationSec: number | null;
  onPhotosAdd: (files: File[], previewUrls: string[]) => void;
  onPhotoRemove: (index: number) => void;
  onPhotosClear: () => void;
  onVideoReady: (file: File, previewUrl: string, durationSec: number) => void;
  onVideoClear: () => void;
  onMediaConflictClear: () => void;
};

export function PostCreateMediaInput({
  imagePreviewUrls,
  videoPreviewUrl,
  videoDurationSec,
  onPhotosAdd,
  onPhotoRemove,
  onPhotosClear,
  onVideoReady,
  onVideoClear,
  onMediaConflictClear,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const hasVideo = videoPreviewUrl != null;
  const hasPhotos = imagePreviewUrls.length > 0;
  const remainingPhotos = POST_PHOTO_MAX_COUNT - imagePreviewUrls.length;

  function openPicker() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;

    setBusy(true);
    setError(null);

    try {
      const videos = files.filter((f) => f.type.startsWith("video/"));
      const images = files.filter((f) => f.type.startsWith("image/"));

      if (videos.length && images.length) {
        setError("写真と動画は同時に追加できません。どちらか一方を選んでください");
        return;
      }

      if (videos.length > 1) {
        setError("動画は1本までです");
        return;
      }

      if (videos.length === 1) {
        if (hasPhotos) {
          onMediaConflictClear();
        }
        const file = videos[0];
        const duration = await validateVideoFile(file);
        onVideoReady(file, URL.createObjectURL(file), duration);
        return;
      }

      if (!images.length) {
        setError("JPEG / PNG / WebP の写真、または15秒以内の動画を選んでください");
        return;
      }

      if (hasVideo) {
        onMediaConflictClear();
      }

      const existingCount = hasVideo ? 0 : imagePreviewUrls.length;
      const result = validatePhotoFiles(images, existingCount);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      const urls = result.files.map((f) => URL.createObjectURL(f));
      onPhotosAdd(result.files, urls);
    } catch (err) {
      setError(err instanceof Error ? err.message : "メディアを追加できませんでした");
    } finally {
      setBusy(false);
    }
  }

  function handleClearAll() {
    if (hasVideo) onVideoClear();
    if (hasPhotos) onPhotosClear();
    setError(null);
  }

  const coverUrl = imagePreviewUrls[0] ?? null;
  const extraUrls = imagePreviewUrls.slice(1);
  const canAddMore = !hasVideo && remainingPhotos > 0;

  return (
    <div className="posts-create-photo">
      <div className="posts-create-photo-area">
        <div className="posts-create-photo-area__main-wrap">
          <button
            type="button"
            className="posts-create-photo-area__main"
            onClick={openPicker}
            disabled={busy}
            aria-label="写真または動画を追加"
          >
            {hasVideo && videoPreviewUrl ? (
              <>
                <video
                  src={videoPreviewUrl}
                  className="posts-create-photo-area__cover"
                  muted
                  playsInline
                  preload="metadata"
                />
                {videoDurationSec != null ? (
                  <span className="posts-create-photo-area__duration">
                    {formatVideoDuration(videoDurationSec)}
                  </span>
                ) : null}
              </>
            ) : coverUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={coverUrl}
                alt=""
                className="posts-create-photo-area__cover"
              />
            ) : (
              <>
                <span className="posts-create-photo-area__icon-ring" aria-hidden>
                  <Camera className="h-6 w-6" strokeWidth={1.6} />
                </span>
                <p className="posts-create-photo-area__title">写真・動画を追加</p>
                <p className="posts-create-photo-area__hint">
                  タップして写真や動画を選択
                  <br />
                  写真は最大10枚・動画は15秒
                </p>
              </>
            )}
            <p className="posts-create-photo-area__count">
              {hasVideo
                ? "動画 1本 · 15秒"
                : `${imagePreviewUrls.length}/${POST_PHOTO_MAX_COUNT}枚`}
            </p>
          </button>

          {!hasVideo && !hasPhotos ? (
            <button
              type="button"
              className="posts-create-photo-area__add-btn"
              onClick={openPicker}
              disabled={busy}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
              追加
            </button>
          ) : null}
        </div>

        <div
          className={cn(
            "posts-create-photo-area__thumbs",
            extraUrls.length === 0 &&
              "posts-create-photo-area__thumbs--mobile-hidden",
          )}
        >
          {hasVideo ? (
            <>
              <button
                type="button"
                className="posts-create-photo-area__thumb posts-create-photo-area__thumb--muted"
                aria-label="動画を削除して写真に切り替え"
                onClick={handleClearAll}
                title="動画を削除"
              >
                −
              </button>
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={`empty-v-${i}`} className="posts-create-photo-area__thumb" />
              ))}
            </>
          ) : (
            Array.from({ length: 6 }).map((_, i) => {
              const url = extraUrls[i];
              if (url) {
                return (
                  <div
                    key={url}
                    className="posts-create-photo-area__thumb-filled"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" />
                    <button
                      type="button"
                      className="posts-create-photo-area__thumb-remove"
                      aria-label={`${i + 2}枚目を削除`}
                      onClick={() => onPhotoRemove(i + 1)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              }
              return (
                <button
                  key={`add-${i}`}
                  type="button"
                  className="posts-create-photo-area__thumb posts-create-photo-area__thumb--add"
                  aria-label="メディアを追加"
                  onClick={openPicker}
                  disabled={busy || !canAddMore}
                >
                  <Plus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                </button>
              );
            })
          )}
        </div>
      </div>

      {hasVideo || hasPhotos ? (
        <div className="posts-create-photo__actions">
          {hasPhotos && remainingPhotos > 0 ? (
            <button
              type="button"
              className="posts-create-video__secondary-btn"
              onClick={openPicker}
              disabled={busy}
            >
              写真を追加
            </button>
          ) : null}
          {hasVideo ? (
            <button
              type="button"
              className="posts-create-video__secondary-btn"
              onClick={openPicker}
              disabled={busy}
            >
              別の動画を選ぶ
            </button>
          ) : null}
          <button
            type="button"
            className="posts-create-video__secondary-btn"
            onClick={handleClearAll}
            disabled={busy}
          >
            すべて削除
          </button>
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*,video/mp4,video/webm,video/quicktime,video/*"
        multiple
        className="sr-only"
        onChange={handleFileChange}
      />

      {busy ? (
        <p className="posts-create-video__hint">メディアを確認しています…</p>
      ) : null}
      {error ? <p className="posts-create-video__error">{error}</p> : null}
    </div>
  );
}
