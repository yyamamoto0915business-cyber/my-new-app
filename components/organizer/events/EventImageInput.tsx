"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { EventThumbnail } from "@/components/event-thumbnail";

type Props = {
  url: string;
  onChangeUrl: (url: string) => void;
  alt: string;
};

/** イベントのアイキャッチ画像入力。URL入力に加えて、ファイル/写真からアップロード可能。 */
export function EventImageInput({ url, onChangeUrl, alt }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeUrl(e.target.value);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;

    // MIMEタイプの確認
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
      // ユーザーIDを取得してパスに含める（RLSポリシーが uid フォルダを要求）
      const { data: { user } } = await supabase.auth.getUser();
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

      const { data: urlData } = supabase.storage
        .from("event-images")
        .getPublicUrl(path);

      if (!urlData?.publicUrl) throw new Error("公開URLの取得に失敗しました");

      onChangeUrl(urlData.publicUrl);
    } catch (err) {
      console.error("EventImageInput upload error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "画像のアップロードに失敗しました"
      );
    } finally {
      setUploading(false);
    }
  };

  const openGallery = () => fileInputRef.current?.click();
  const openCamera = () => cameraInputRef.current?.click();

  return (
    <div className="space-y-3">
      <input
        id="imageUrl"
        name="imageUrl"
        type="url"
        value={url}
        onChange={handleUrlChange}
        placeholder="https://images.unsplash.com/photo-xxx?w=800"
        className="mt-2 w-full rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200/50"
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={openGallery}
          disabled={uploading}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          ファイルから選ぶ
        </button>
        <button
          type="button"
          onClick={openCamera}
          disabled={uploading}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          写真を撮る
        </button>
        {uploading && (
          <span className="text-xs text-slate-500">アップロード中...</span>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="mt-1 overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/50">
        <EventThumbnail
          imageUrl={url.trim() || null}
          alt={alt || "プレビュー"}
          rounded="lg"
        />
      </div>

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
    </div>
  );
}

