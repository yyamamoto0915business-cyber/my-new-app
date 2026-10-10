"use client";

import { useRef, useState } from "react";
import styles from "@/components/organizer/games/StampRallyWizard.module.css";

const MAX_BYTES = 4 * 1024 * 1024;

type Props = {
  label: string;
  url: string;
  gameId?: string | null;
  onChange: (url: string) => void;
};

export function GameAudioField({ label, url, gameId, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["mp3", "m4a", "wav", "aac"].includes(ext)) {
      setError("MP3、M4A、WAV、AAC の音声を選んでください");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("音声は 4MB までです");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.set("file", file);
      if (gameId) body.set("gameId", gameId);
      const res = await fetch("/api/organizer/games/audio", { method: "POST", body });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        setError(json.error ?? "音声のアップロードに失敗しました");
        return;
      }
      onChange(json.url);
    } catch {
      setError("音声のアップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={styles.imageField}>
      <span>{label}</span>
      {url ? <audio src={url} controls preload="none" /> : null}
      <div className={styles.imageActions}>
        <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? "送っています…" : url ? "音声を差し替える" : "音声を選ぶ"}
        </button>
        {url ? (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setError(null);
            }}
          >
            音声を外す
          </button>
        ) : null}
      </div>
      <small>MP3、M4A、WAV、AAC。4MBまで。空なら、選んだ効果音が鳴ります。</small>
      {error ? <p className="org-store-intro__error">{error}</p> : null}
      <input
        ref={inputRef}
        className={styles.imageInput}
        type="file"
        accept="audio/mpeg,audio/mp4,audio/wav,audio/aac,.mp3,.m4a,.wav,.aac"
        onChange={(event) => void onFile(event)}
      />
    </div>
  );
}
