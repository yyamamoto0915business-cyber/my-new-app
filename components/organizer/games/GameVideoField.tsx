"use client";

import { useRef, useState } from "react";
import styles from "@/components/organizer/games/StampRallyWizard.module.css";
import { createClient } from "@/lib/supabase/client";

const ALLOWED = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const MAX_BYTES = 20 * 1024 * 1024;

type Props = {
  label: string;
  url: string;
  gameId?: string | null;
  onChange: (url: string) => void;
};

export function GameVideoField({ label, url, gameId, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const known = ext === "mp4" || ext === "webm" || ext === "mov";
    if (!ALLOWED.has(file.type) && !known) {
      setError("MP4、WEBM、MOV の動画を選んでください");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("動画は 20MB までです");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const res = await fetch("/api/organizer/games/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          size: file.size,
          gameId: gameId ?? "",
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        bucket?: string;
        path?: string;
        token?: string;
        publicUrl?: string;
      };
      if (!res.ok || !json.bucket || !json.path || !json.token || !json.publicUrl) {
        setError(json.error ?? "動画のアップロードに失敗しました");
        return;
      }
      const supabase = createClient();
      if (!supabase) {
        setError("動画のアップロードに失敗しました");
        return;
      }
      const uploaded = await supabase.storage.from(json.bucket).uploadToSignedUrl(json.path, json.token, file, {
        contentType: file.type || "video/mp4",
      });
      if (uploaded.error) {
        setError("動画のアップロードに失敗しました");
        return;
      }
      onChange(json.publicUrl);
    } catch {
      setError("動画のアップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={styles.imageField}>
      <span>{label}</span>
      {url ? <video className={styles.imagePreview} src={url} controls playsInline preload="metadata" /> : null}
      <div className={styles.imageActions}>
        <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? "送っています…" : url ? "動画を差し替える" : "動画を選ぶ"}
        </button>
        {url ? (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setError(null);
            }}
          >
            動画を外す
          </button>
        ) : null}
      </div>
      <small>MP4、WEBM、MOV。20MBまで。空のままでも保存できます。</small>
      {error ? <p className="org-store-intro__error">{error}</p> : null}
      <input
        ref={inputRef}
        className={styles.imageInput}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
        onChange={(event) => void onFile(event)}
      />
    </div>
  );
}
