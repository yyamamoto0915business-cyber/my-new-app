"use client";

import { useRef, useState } from "react";
import styles from "@/components/organizer/games/StampRallyWizard.module.css";

const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

type Props = {
  label: string;
  url: string;
  gameId?: string | null;
  onChange: (url: string) => void;
};

export function GameImageField({ label, url, gameId, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) return;
    const type = file.type === "image/jpg" ? "image/jpeg" : file.type;
    if (!ALLOWED.has(file.type) && !ALLOWED.has(type)) {
      setError("JPEG、PNG、WEBP の写真を選んでください");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("写真は 5MB までです");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("file", file);
      if (gameId) body.set("gameId", gameId);
      const res = await fetch("/api/organizer/games/images", { method: "POST", body });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        setError(json.error ?? "画像のアップロードに失敗しました");
        return;
      }
      onChange(json.url);
    } catch {
      setError("画像のアップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={styles.imageField}>
      <span>{label}</span>
      {url ? <img className={styles.imagePreview} src={url} alt="" /> : null}
      <div className={styles.imageActions}>
        <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? "送っています…" : url ? "写真を差し替える" : "写真を選ぶ"}
        </button>
        {url ? (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setError(null);
            }}
          >
            写真を外す
          </button>
        ) : null}
      </div>
      <small>JPEG、PNG、WEBP。5MBまで。空のままでも保存できます。</small>
      {error ? <p className="org-store-intro__error">{error}</p> : null}
      <input
        ref={inputRef}
        className={styles.imageInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => void onFile(event)}
      />
    </div>
  );
}
