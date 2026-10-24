"use client";

import { useEffect, useState } from "react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

type Photo = { playerId: string; nickname: string; missionIndex: number; missionName: string; url: string; at: string };
type Desk = { enabled: boolean; ready: boolean; photos: Photo[] };

/** ミッションの「写真を投稿」で、参加者から届いた写真の一覧。 */
export function OrganizerMissionPhotos({ gameId, gameType }: { gameId: string; gameType: string }) {
  const [desk, setDesk] = useState<Desk | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<Photo | null>(null);

  useEffect(() => {
    if (gameType !== "mission" || !gameId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchWithTimeout(`/api/organizer/games/${gameId}/mission-photos`, { cache: "no-store" }, 8000);
        const json = (await res.json().catch(() => ({}))) as Desk & { error?: string };
        if (!res.ok) throw new Error(json.error || "写真を読み込めませんでした");
        if (!cancelled) {
          setDesk({ enabled: json.enabled === true, ready: json.ready !== false, photos: Array.isArray(json.photos) ? json.photos : [] });
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "写真を読み込めませんでした");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gameId, gameType]);

  if (gameType !== "mission") return null;
  if (!desk && !error) return null;
  if (desk && !desk.enabled) return null;

  return (
    <section className="org-game-editor__panel">
      <h2>届いた写真</h2>
      {desk && !desk.ready ? (
        <p className="org-game-editor__empty">写真を残す準備ができていません（データベースの更新が必要です）。</p>
      ) : null}
      {desk?.ready && desk.photos.length === 0 ? <p className="org-game-editor__empty">まだ写真は届いていません。</p> : null}
      {desk && desk.photos.length > 0 ? (
        <ul style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(8.5rem, 1fr))", gap: "0.6rem", margin: 0, padding: 0, listStyle: "none" }}>
          {desk.photos.map((photo) => (
            <li key={`${photo.playerId}-${photo.missionIndex}`}>
              <button
                type="button"
                onClick={() => setOpen(photo)}
                style={{ display: "grid", gap: "0.25rem", width: "100%", padding: 0, border: 0, background: "none", textAlign: "left", cursor: "pointer" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- 参加者が送った写真 */}
                <img src={photo.url} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: "0.7rem", background: "#eef1ec" }} />
                <b style={{ fontSize: "0.78rem" }}>{photo.nickname}</b>
                <small style={{ fontSize: "0.68rem", color: "#6a7568" }}>
                  {photo.missionName}
                  {photo.at ? `・${new Date(photo.at).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}` : ""}
                </small>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {error ? <p className="org-game-editor__note">{error}</p> : null}
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="写真"
          onClick={() => setOpen(null)}
          style={{ position: "fixed", inset: 0, zIndex: 1000, display: "grid", placeItems: "center", padding: "1rem", background: "rgba(0, 0, 0, 0.8)" }}
        >
          <figure style={{ margin: 0, maxWidth: "min(48rem, 100%)", color: "#fff", textAlign: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- 参加者が送った写真 */}
            <img src={open.url} alt="" style={{ maxWidth: "100%", maxHeight: "78dvh", borderRadius: "0.8rem" }} />
            <figcaption style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
              {open.nickname}・{open.missionName}（タップで閉じる）
            </figcaption>
          </figure>
        </div>
      ) : null}
    </section>
  );
}
