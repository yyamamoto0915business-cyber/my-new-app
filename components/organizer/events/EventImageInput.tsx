"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { EventThumbnail } from "@/components/event-thumbnail";

type Props = {
  url: string;
  onChangeUrl: (url: string) => void;
  alt: string;
  /** PCフォーム向け：プレビューと操作を横並びにしたコンパクトレイアウト */
  compact?: boolean;
  /** compact 時に外枠を付けない（親カード内に埋め込むとき） */
  bare?: boolean;
  /** ヒント文の上書き（未指定時はデフォルト文言） */
  hint?: string;
};

const btnClass =
  "inline-flex min-h-[34px] w-full items-center justify-center gap-1.5 rounded-[9px] border border-[#d0ccc4] bg-white px-2.5 text-[12px] font-medium text-[#1a1a1a] shadow-sm transition hover:border-[#2B3A6B] hover:bg-[#f5f4f0] disabled:opacity-50 min-[900px]:min-h-[40px] min-[900px]:gap-2 min-[900px]:rounded-[10px] min-[900px]:px-3 min-[900px]:text-[13px]";

/** イベントのアイキャッチ画像入力。URL入力に加えて、ファイル/写真からアップロード可能。 */
export function EventImageInput({
  url,
  onChangeUrl,
  alt,
  compact = false,
  bare = false,
  hint: hintProp,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasImage = Boolean(url.trim());

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeUrl(e.target.value);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
      setError("対応していないファイル形式です（JPEG・PNG・GIF・WebP のみ）");
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setError("画像ストレージが利用できません");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = user?.id ?? "anonymous";

      const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
      const safeName = file.name
        .replace(/\.[^.]+$/, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .slice(0, 40);
      const path = `${userId}/${Date.now()}-${safeName}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("event-images")
        .upload(path, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("event-images").getPublicUrl(path);

      if (!urlData?.publicUrl) throw new Error("公開URLの取得に失敗しました");

      onChangeUrl(urlData.publicUrl);
    } catch (err) {
      console.error("EventImageInput upload error:", err);
      setError(
        err instanceof Error ? err.message : "画像のアップロードに失敗しました"
      );
    } finally {
      setUploading(false);
    }
  };

  const openGallery = () => fileInputRef.current?.click();
  const openCamera = () => cameraInputRef.current?.click();
  const clearImage = () => {
    onChangeUrl("");
    setError(null);
  };

  const hint =
    hintProp ??
    (hasImage ? "一覧に 16:9 で表示されます" : "未設定のままでも保存できます");

  const hiddenInputs = (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
    </>
  );

  const statusLines = (
    <>
      {uploading && (
        <p className="rounded-[8px] bg-[#EEF2FF] px-3 py-2 text-[12px] font-medium text-[#2B3A6B]">
          アップロード中…
        </p>
      )}
      {error && (
        <p className="rounded-[8px] bg-red-50 px-3 py-2 text-[12px] text-[#E8708A]" role="alert">
          {error}
        </p>
      )}
    </>
  );

  if (compact) {
    return (
      <div
        className={
          bare
            ? undefined
            : "rounded-[10px] border border-[#ebe8e2] bg-[#fafaf8] p-2"
        }
      >
        <div className="flex items-center gap-3">
          <div
            className={[
              "relative w-[7.5rem] shrink-0 overflow-hidden rounded-[8px] bg-white min-[900px]:w-[9.5rem]",
              hasImage
                ? "border border-[#e0ddd6] shadow-[0_1px_2px_rgba(26,26,26,0.04)]"
                : "border border-dashed border-[#d8d4cc]",
            ].join(" ")}
          >
            <EventThumbnail
              imageUrl={url.trim() || null}
              alt={alt || "イベント画像"}
              rounded="none"
              placeholderSize="sm"
              className="!aspect-video !max-h-none !rounded-none"
            />
            {hasImage ? (
              <button
                type="button"
                onClick={clearImage}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-black/60"
                aria-label="画像を削除"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <p className="mb-1.5 text-[11px] leading-snug text-[#8a8680]">{hint}</p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={openGallery}
                disabled={uploading}
                className="inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-[#2B3A6B] px-3 text-[12px] font-medium text-white transition hover:bg-[#243159] disabled:opacity-50"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                {hasImage ? "変更" : "選択"}
              </button>
              <button
                type="button"
                onClick={openCamera}
                disabled={uploading}
                className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-[#d0ccc4] bg-white px-2.5 text-[12px] font-medium text-[#1a1a1a] transition hover:border-[#2B3A6B] hover:bg-[#f5f4f0] disabled:opacity-50"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                撮影
              </button>
            </div>
          </div>
        </div>

        {(uploading || error) && <div className="mt-2">{statusLines}</div>}
        {hiddenInputs}
      </div>
    );
  }

  return (
    <div className="space-y-2 min-[900px]:space-y-3">
      <div className="overflow-hidden rounded-[9px] border border-[#e8e6e0] bg-[#fafaf8] min-[900px]:rounded-[10px]">
        <EventThumbnail
          imageUrl={url.trim() || null}
          alt={alt || "イベント画像"}
          rounded="lg"
          placeholderSize="sm"
          className="!aspect-video max-h-[5.25rem] min-[900px]:max-h-none"
        />
      </div>
      <p className="text-[11px] leading-snug text-[#5c5a54] min-[900px]:text-[12px] min-[900px]:leading-relaxed">
        {hint}
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        <button type="button" onClick={openGallery} disabled={uploading} className={btnClass}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          画像を選択
        </button>
        <button type="button" onClick={openCamera} disabled={uploading} className={btnClass}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          写真を撮る
        </button>
      </div>
      {statusLines}
      <details className="group rounded-[10px] border border-[#e8e6e0] bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3.5 py-2.5 text-[13px] font-medium text-[#4a4844] [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 text-[#888]" aria-hidden>
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
            URLから設定
          </span>
          <span className="text-[10.5px] font-normal text-[#888]">任意</span>
        </summary>
        <div className="border-t border-[#e8e6e0] px-3.5 pb-3.5 pt-2">
          <input
            id="imageUrl"
            name="imageUrl"
            type="url"
            value={url}
            onChange={handleUrlChange}
            placeholder="https://example.com/image.jpg"
            className="w-full rounded-[9px] border border-[#e8e6e0] bg-[#fafaf8] px-3 py-2.5 text-[13px] text-[#1a1a1a] placeholder:text-[#aaa] outline-none transition focus:border-[#2B3A6B] focus:bg-white"
          />
        </div>
      </details>
      {hiddenInputs}
    </div>
  );
}
