"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Plus, X } from "lucide-react";
import { MAX_STORE_GALLERY_IMAGES } from "@/lib/stores/types";
import {
  logStoreUploadError,
  storageErrorMessage,
  uploadStoreImageFile,
} from "@/lib/stores/upload-store-image";

type Props = {
  urls: string[];
  onChange: (urls: string[]) => void;
  storeId: string;
  /** 余白・サムネを詰めた表示 */
  compact?: boolean;
};

/** 店舗ギャラリー画像（最大 MAX_STORE_GALLERY_IMAGES 枚） */
export function StoreGalleryImagesInput({
  urls,
  onChange,
  storeId,
  compact = false,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const remaining = Math.max(0, MAX_STORE_GALLERY_IMAGES - urls.length);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;

    const toUpload = files.slice(0, remaining);
    if (!toUpload.length) {
      setError(`ギャラリーは最大${MAX_STORE_GALLERY_IMAGES}枚までです`);
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const nextUrls: string[] = [];
      for (const file of toUpload) {
        const publicUrl = await uploadStoreImageFile({
          file,
          kind: "gallery",
          storeId,
        });
        nextUrls.push(publicUrl);
      }
      onChange([...urls, ...nextUrls].slice(0, MAX_STORE_GALLERY_IMAGES));
    } catch (err) {
      logStoreUploadError("StoreGalleryImagesInput upload", err);
      setError(storageErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      <div className={compact ? "flex flex-wrap gap-1.5" : "flex flex-wrap gap-2"}>
        {urls.map((src) => (
          <div
            key={src}
            className={
              compact
                ? "relative h-12 w-12 overflow-hidden rounded-md border border-[#d5e2d8]"
                : "relative h-16 w-16 overflow-hidden rounded-lg border border-[#d5e2d8]"
            }
          >
            <Image src={src} alt="" fill className="object-cover" unoptimized />
            <button
              type="button"
              className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white"
              aria-label="削除"
              onClick={() => onChange(urls.filter((u) => u !== src))}
            >
              <X className="size-3" strokeWidth={2.5} />
            </button>
          </div>
        ))}
        {remaining > 0 ? (
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className={
              compact
                ? "flex h-12 w-12 flex-col items-center justify-center gap-0 rounded-md border border-dashed border-[#b8c9bc] bg-[#f7f9f7] text-[#6a7468] transition hover:border-[#2D7A4F] hover:text-[#2D7A4F] disabled:opacity-50"
                : "flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-lg border border-dashed border-[#b8c9bc] bg-[#f7f9f7] text-[#6a7468] transition hover:border-[#2D7A4F] hover:text-[#2D7A4F] disabled:opacity-50"
            }
          >
            <Plus className={compact ? "size-3.5" : "size-4"} strokeWidth={2.4} />
            <span className="text-[10px] font-semibold">追加</span>
          </button>
        ) : null}
      </div>
      <p className={compact ? "text-[10px] text-[#7a857c]" : "text-[11px] text-[#7a857c]"}>
        最大{MAX_STORE_GALLERY_IMAGES}枚まで（残り{remaining}枚）
      </p>
      {uploading ? (
        <p className="text-[12px] font-medium text-[#2D7A4F]">アップロード中…</p>
      ) : null}
      {error ? (
        <p className="text-[12px] text-[#E8708A]" role="alert">
          {error}
        </p>
      ) : null}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/jpg,.jpg,.jpeg,.png,.gif,.webp"
        multiple
        onChange={(e) => void handleFileSelect(e)}
        className="hidden"
      />
    </div>
  );
}
