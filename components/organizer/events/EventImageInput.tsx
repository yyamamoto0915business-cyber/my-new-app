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
      <div className="space-y-2">
        <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50/50">
          <EventThumbnail
            imageUrl={url.trim() || null}
            alt={alt || "イベント画像"}
            rounded="lg"
          />
        </div>
        <p className="text-xs text-slate-500">イベント一覧で表示される画像です（16:9）</p>
        {!url.trim() && (
          <p className="text-xs text-slate-500">
            まだ未設定です。あとで変更しても大丈夫です。
          </p>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={openGallery}
          disabled={uploading}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          画像をアップロード
        </button>
        <button
          type="button"
          onClick={openCamera}
          disabled={uploading}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          写真を撮る
        </button>
      </div>

      {uploading && (
        <p className="text-xs text-slate-500">アップロード中...</p>
      )}

      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}

      <details className="rounded-xl border border-slate-200/80 bg-slate-50/40 p-3">
        <summary className="cursor-pointer text-xs font-medium text-slate-600">
          URLから設定する（必要なときだけ）
        </summary>
        <input
          id="imageUrl"
          name="imageUrl"
          type="url"
          value={url}
          onChange={handleUrlChange}
          placeholder="https://images.unsplash.com/photo-xxx?w=800"
          className="mt-3 w-full rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200/50"
        />
      </details>

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

