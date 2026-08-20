"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MAX_GALLERY_IMAGES } from "@/lib/gallery-images";

type Props = {
  urls: string[];
  onChange: (urls: string[]) => void;
  /** 余白を詰めた表示 */
  compact?: boolean;
};

/**
 * イベント／募集の追加ギャラリー画像入力（代表画像とは別・最大5枚）。
 * ＋タイルのみで追加（フル幅ボタンなし）。
 */
export function EventGalleryImagesInput({ urls, onChange, compact = false }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const remaining = Math.max(0, MAX_GALLERY_IMAGES - urls.length);
  const canAdd = remaining > 0;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) =>
      ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(f.type)
    );
    e.target.value = "";
    if (!files.length) return;

    const toUpload = files.slice(0, remaining);
    if (!toUpload.length) {
      setError(`追加画像は最大${MAX_GALLERY_IMAGES}枚までです`);
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
      const nextUrls: string[] = [];

      for (const file of toUpload) {
        const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
        const path = `${userId}/gallery/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("event-images")
          .upload(path, file, { upsert: false });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("event-images").getPublicUrl(path);
        if (!urlData?.publicUrl) throw new Error("公開URLの取得に失敗しました");
        nextUrls.push(urlData.publicUrl);
      }

      onChange([...urls, ...nextUrls].slice(0, MAX_GALLERY_IMAGES));
    } catch (err) {
      console.error("EventGalleryImagesInput upload error:", err);
      setError(err instanceof Error ? err.message : "画像のアップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  };

  const removeAt = (idx: number) => {
    onChange(urls.filter((_, i) => i !== idx));
    setError(null);
  };

  const tileCls =
    "relative h-14 w-14 shrink-0 overflow-hidden rounded-[7px] border border-[#e0ddd6] bg-[#f5f4f0] min-[900px]:h-16 min-[900px]:w-16";

  return (
    <div className={compact ? "space-y-1.5" : "space-y-1.5"}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[12px] font-medium text-[#4a4844]">
          追加画像
          <span className="ml-1.5 text-[10.5px] font-normal text-[#8a8680]">
            任意 · {urls.length}/{MAX_GALLERY_IMAGES}
          </span>
        </p>
        {uploading ? (
          <p className="text-[10.5px] font-medium text-[#2B3A6B]">アップロード中…</p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {urls.map((url, idx) => (
          <div key={`${url}-${idx}`} className={tileCls}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(idx)}
              className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/55 text-[9px] leading-none text-white transition hover:bg-black/70"
              aria-label={`画像${idx + 1}を削除`}
            >
              ×
            </button>
          </div>
        ))}
        {canAdd ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`${tileCls} flex items-center justify-center border-dashed border-[#d8d4cc] bg-[#fafaf8] text-[18px] text-[#8c8a84] transition hover:border-[#2B3A6B] hover:text-[#2B3A6B] disabled:opacity-50`}
            aria-label="画像を追加"
          >
            ＋
          </button>
        ) : null}
      </div>

      <p className="text-[10.5px] leading-snug text-[#8a8680]">
        詳細で切り替え · 一覧は代表のみ
      </p>

      {error ? (
        <p className="rounded-[8px] bg-red-50 px-2.5 py-1.5 text-[11px] text-[#E8708A]" role="alert">
          {error}
        </p>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
