"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

/** 保存したゲーム。作成画面はここから自分の入力欄に戻す。 */
export type LoadedGameDraft = {
  name: string;
  description: string;
  eventId: string;
  /** YYYY-MM-DD（日本時間）。なければ空。 */
  startDate: string;
  endDate: string;
  /** HH:MM（日本時間）。なければ空。 */
  startTime: string;
  endTime: string;
  status: "draft" | "published" | "archived";
  settings: Record<string, unknown>;
};

export type GameDraftSaveResult = { ok: true; id: string } | { ok: false; error: string };

/** ISO の日時を、日本時間の YYYY-MM-DD と HH:MM に分ける。 */
function jstParts(iso: string | null | undefined): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return { date: "", time: "" };
  const text = new Date(time + 9 * 60 * 60 * 1000).toISOString();
  return { date: text.slice(0, 10), time: text.slice(11, 16) };
}

/**
 * スタンプラリー以外の作成画面で、下書きを開き直して直す。
 * `?edit=ゲームID` のときは保存した内容を読みこみ、保存は新しく作らずに同じゲームを上書きする。
 * 新しく作るときも、1回保存したあとは同じゲームを上書きする（下書きが増えないように）。
 */
export function useGameDraft(onLoad: (draft: LoadedGameDraft) => void) {
  const editId = useSearchParams().get("edit");
  const [gameId, setGameId] = useState<string | null>(editId);
  const [loading, setLoading] = useState(Boolean(editId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadedStatus, setLoadedStatus] = useState<LoadedGameDraft["status"] | null>(null);
  const onLoadRef = useRef(onLoad);

  useEffect(() => {
    onLoadRef.current = onLoad;
  });

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchWithTimeout(`/api/organizer/games/${editId}`, { cache: "no-store" }, 10000);
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json.game) {
          setLoadError(json.error ?? "保存したゲームを読みこめませんでした");
          return;
        }
        const game = json.game as {
          name?: string;
          description?: string;
          eventId?: string | null;
          startsAt?: string | null;
          endsAt?: string | null;
          status?: LoadedGameDraft["status"];
        };
        const status = game.status ?? "draft";
        setLoadedStatus(status);
        const start = jstParts(game.startsAt);
        const end = jstParts(game.endsAt);
        onLoadRef.current({
          name: game.name ?? "",
          description: game.description ?? "",
          eventId: game.eventId ?? "",
          startDate: start.date,
          endDate: end.date,
          startTime: start.time,
          endTime: end.time,
          status,
          settings: json.settings && typeof json.settings === "object" ? json.settings : {},
        });
      } catch {
        if (!cancelled) setLoadError("通信エラーで、保存したゲームを読みこめませんでした");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId]);

  /** 作成なら POST、2回目からと開き直しなら PUT。公開中のゲームは「下書き保存」でも公開のままにする。 */
  async function saveGame(body: Record<string, unknown>, status: "draft" | "published"): Promise<GameDraftSaveResult> {
    const keepPublished = loadedStatus === "published" && status === "draft";
    const payload = keepPublished ? { ...body, status: undefined } : { ...body, status };
    try {
      const res = await fetch(gameId ? `/api/organizer/games/${gameId}` : "/api/organizer/games", {
        method: gameId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) return { ok: false, error: json.error ?? "保存に失敗しました" };
      const id = (json.game?.id as string | undefined) ?? gameId;
      if (!id) return { ok: false, error: "保存に失敗しました" };
      setGameId(id);
      return { ok: true, id };
    } catch {
      return { ok: false, error: "通信エラーが発生しました" };
    }
  }

  return {
    /** 開き直しているゲームの ID（新しく作っているときは null）。 */
    editId,
    loading,
    loadError,
    /** 公開中のゲームを直しているか。 */
    editingPublished: loadedStatus === "published",
    saveGame,
  };
}
