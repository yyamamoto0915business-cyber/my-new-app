"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl?: string | null;
  onAvatarChange: (newUrl: string | null) => void;
  userId: string;
};

export function AvatarChangeModal({
  isOpen,
  onClose,
  currentAvatarUrl,
  onAvatarChange,
  userId,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;

    const supabase = createClient();
    if (!supabase) {
      setError("ストレージが利用できません");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      await supabase
        .from("profiles")
        .update({ avatar_url: urlData.publicUrl, updated_at: new Date().toISOString() })
        .eq("id", userId);

      onAvatarChange(urlData.publicUrl);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "アップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    const supabase = createClient();
    if (!supabase) return;

    setUploading(true);
    setError(null);
    try {
      await supabase
        .from("profiles")
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq("id", userId);

      onAvatarChange(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setUploading(false);
    }
  };

  const openGallery = () => fileInputRef.current?.click();
  const openCamera = () => cameraInputRef.current?.click();

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--border)] bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 dark:border-zinc-700">
          <h3 className="font-medium text-zinc-900 dark:text-zinc-100">アイコンを変更</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="閉じる"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mt-3 space-y-2">
          <button
            type="button"
            onClick={openCamera}
            disabled={uploading}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--foreground-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7" />
            </svg>
            <span>カメラで撮影</span>
          </button>
          <button
            type="button"
            onClick={openGallery}
            disabled={uploading}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--foreground-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>アルバムから選択</span>
          </button>
          {currentAvatarUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>削除</span>
            </button>
          )}
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
        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {uploading && (
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">処理中...</p>
        )}
      </div>
    </>
  );
}
