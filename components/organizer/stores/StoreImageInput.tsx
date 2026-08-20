"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  logStoreUploadError,
  storageErrorMessage,
  uploadStoreImageFile,
  type StoreImageKind,
} from "@/lib/stores/upload-store-image";

export type { StoreImageKind };

type Props = {
  url: string;
  onChangeUrl: (url: string) => void;
  alt: string;
  kind?: StoreImageKind;
  storeId?: string;
  hint?: string;
  /** 正方形プレビュー（メニュー向け） */
  square?: boolean;
  /** 店舗紹介など余白を詰めた表示 */
  compact?: boolean;
  /** プレビューと操作を1行にまとめた超コンパクト表示（ニュース等） */
  inline?: boolean;
};

const btnClass =
  "inline-flex min-h-[34px] w-full items-center justify-center gap-1.5 rounded-[9px] border border-[#d0ccc4] bg-white px-2.5 text-[12px] font-medium text-[#1a1a1a] shadow-sm transition hover:border-[#2D7A4F] hover:bg-[#f4f8f4] disabled:opacity-50";

const btnClassCompact =
  "inline-flex min-h-[30px] w-full items-center justify-center gap-1 rounded-lg border border-[#d0ccc4] bg-white px-2 text-[11px] font-medium text-[#1a1a1a] shadow-sm transition hover:border-[#2D7A4F] hover:bg-[#f4f8f4] disabled:opacity-50";

const btnClassInline =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-lg border border-[#d0ccc4] bg-white px-3 text-[11px] font-medium text-[#1a1a1a] shadow-sm transition hover:border-[#2D7A4F] hover:bg-[#f4f8f4] disabled:opacity-50";

/**
 * 店舗向け画像入力（ファイル／撮影／URL）。
 * Supabase 未設定時は URL 入力のみ利用可能。
 */
export function StoreImageInput({
  url,
  onChangeUrl,
  alt,
  kind = "cover",
  storeId = "common",
  hint,
  square = false,
  compact = false,
  inline = false,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasImage = Boolean(url.trim());

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const publicUrl = await uploadStoreImageFile({ file, kind, storeId });
      onChangeUrl(publicUrl);
    } catch (err) {
      logStoreUploadError("StoreImageInput upload", err);
      setError(storageErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const hiddenInputs = (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/jpg,.jpg,.jpeg,.png,.gif,.webp"
        onChange={(e) => void handleFileSelect(e)}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => void handleFileSelect(e)}
        className="hidden"
      />
    </>
  );

  if (inline) {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="relative h-[4.75rem] w-[7rem] shrink-0 overflow-hidden rounded-lg border border-[#e8e6e0] bg-[#fafaf8]">
            {hasImage ? (
              <Image
                src={url.trim()}
                alt={alt}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center px-1 text-center text-[11px] leading-tight text-[#9aa39c]">
                未設定
              </div>
            )}
            {hasImage ? (
              <button
                type="button"
                onClick={() => {
                  onChangeUrl("");
                  setError(null);
                }}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/45 text-[11px] text-white"
                aria-label="画像を削除"
              >
                ×
              </button>
            ) : null}
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            {hint ? (
              <p className="text-[10px] leading-snug text-[#5c5a54]">{hint}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className={btnClassInline}
              >
                {uploading ? "送信中…" : hasImage ? "画像を変更" : "画像を選択"}
              </button>
              <details className="min-w-0">
                <summary className="cursor-pointer list-none text-[10px] font-medium text-[#6a7468] [&::-webkit-details-marker]:hidden">
                  URLから設定
                </summary>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => onChangeUrl(e.target.value)}
                  placeholder="https://…"
                  className="mt-1 w-full min-w-[12rem] rounded-lg border border-[#e8e6e0] bg-[#fafaf8] px-2 py-1 text-[11px] outline-none focus:border-[#2D7A4F]"
                />
              </details>
            </div>
          </div>
        </div>
        {error ? (
          <p className="text-[11px] text-[#E8708A]" role="alert">
            {error}
          </p>
        ) : null}
        {hiddenInputs}
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      <div
        className={[
          "relative overflow-hidden rounded-[9px] border border-[#e8e6e0] bg-[#fafaf8]",
          square
            ? "aspect-square max-w-[11rem]"
            : compact
              ? "aspect-video max-h-[6.5rem]"
              : "aspect-video max-h-[9rem]",
        ].join(" ")}
      >
        {hasImage ? (
          <Image
            src={url.trim()}
            alt={alt}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div
            className={[
              "flex h-full items-center justify-center text-[#9aa39c]",
              compact ? "min-h-[3.5rem] text-[11px]" : "min-h-[5rem] text-[12px]",
            ].join(" ")}
          >
            画像未設定
          </div>
        )}
        {hasImage ? (
          <button
            type="button"
            onClick={() => {
              onChangeUrl("");
              setError(null);
            }}
            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-black/60"
            aria-label="画像を削除"
          >
            ×
          </button>
        ) : null}
      </div>

      {hint ? (
        <p className={compact ? "text-[10px] leading-snug text-[#5c5a54]" : "text-[11px] leading-snug text-[#5c5a54]"}>
          {hint}
        </p>
      ) : !compact ? (
        <p className="text-[11px] leading-snug text-[#5c5a54]">
          {hasImage
            ? "公開ページに表示されます"
            : "ファイル選択、または URL から設定できます"}
        </p>
      ) : null}

      <div className={compact ? "grid grid-cols-2 gap-1.5" : "grid grid-cols-2 gap-2"}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={compact ? btnClassCompact : btnClass}
        >
          {hasImage ? "画像を変更" : "画像を選択"}
        </button>
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={uploading}
          className={compact ? btnClassCompact : btnClass}
        >
          写真を撮る
        </button>
      </div>

      {uploading ? (
        <p className="rounded-[8px] bg-[#EAF4ED] px-3 py-1.5 text-[12px] font-medium text-[#2D7A4F]">
          アップロード中…
        </p>
      ) : null}
      {error ? (
        <p className="rounded-[8px] bg-red-50 px-3 py-1.5 text-[12px] text-[#E8708A]" role="alert">
          {error}
        </p>
      ) : null}

      <details className="rounded-[10px] border border-[#e8e6e0] bg-white">
        <summary
          className={[
            "cursor-pointer list-none font-medium text-[#4a4844] [&::-webkit-details-marker]:hidden",
            compact ? "px-3 py-1.5 text-[12px]" : "px-3.5 py-2.5 text-[13px]",
          ].join(" ")}
        >
          URLから設定（任意）
        </summary>
        <div className={compact ? "border-t border-[#e8e6e0] px-3 pb-2.5 pt-1.5" : "border-t border-[#e8e6e0] px-3.5 pb-3.5 pt-2"}>
          <input
            type="url"
            value={url}
            onChange={(e) => onChangeUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className={[
              "w-full rounded-[9px] border border-[#e8e6e0] bg-[#fafaf8] outline-none focus:border-[#2D7A4F] focus:bg-white",
              compact ? "px-2.5 py-1.5 text-[12px]" : "px-3 py-2.5 text-[13px]",
            ].join(" ")}
          />
        </div>
      </details>

      {hiddenInputs}
    </div>
  );
}
