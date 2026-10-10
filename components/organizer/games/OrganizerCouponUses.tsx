"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

type CouponPlayer = {
  id: string;
  nickname: string;
  usedAt: string | null;
  code?: string | null;
};

type Desk = {
  enabled: boolean;
  ready: boolean;
  players: CouponPlayer[];
};

export function OrganizerCouponUses({ gameId, gameType }: { gameId: string; gameType: string }) {
  const [desk, setDesk] = useState<Desk | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetchWithTimeout(`/api/organizer/games/${gameId}/coupon-uses`, { cache: "no-store" }, 8000);
    const json = (await res.json().catch(() => ({}))) as Desk & { error?: string };
    if (!res.ok) throw new Error(json.error || "使用状況を読み込めませんでした");
    setDesk({
      enabled: json.enabled === true,
      ready: json.ready !== false,
      players: Array.isArray(json.players) ? json.players : [],
    });
  }, [gameId]);

  useEffect(() => {
    if ((gameType !== "stamp" && gameType !== "coupon" && gameType !== "quiz") || !gameId) return;
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "使用状況を読み込めませんでした");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gameId, gameType, load]);

  if (gameType !== "stamp" && gameType !== "coupon" && gameType !== "quiz") return null;
  if (!desk && !error) return null;
  if (desk && !desk.enabled) return null;

  async function markUsed(player: CouponPlayer) {
    if (!window.confirm(`${player.nickname}さんのクーポンを使用済みにします。よろしいですか？`)) return;
    setSavingId(player.id);
    setError(null);
    try {
      const res = await fetch(`/api/organizer/games/${gameId}/coupon-uses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: player.id }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; player?: CouponPlayer };
      const saved = json.player;
      if (!res.ok || !saved) {
        setError(json.error ?? "使用済みにできませんでした");
        return;
      }
      setDesk((current) => {
        if (!current) return current;
        return {
          ...current,
          players: current.players.map((item) => (item.id === saved.id ? saved : item)),
        };
      });
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="org-game-editor__panel">
      <h2>クーポンの使用</h2>
      <p>クリアした人がコードを見せたら、使用済みにします。参加者の画面も「使用済み」に変わります。</p>
      {desk && !desk.ready ? <p className="org-game-editor__empty">使用記録の準備ができていません。</p> : null}
      {desk?.ready && desk.players.length === 0 ? (
        <p className="org-game-editor__empty">まだクリアした人はいません。</p>
      ) : null}
      {desk?.ready && desk.players.length > 0 ? (
        <ul className="org-game-coupon">
          {desk.players.map((player) => (
            <li key={player.id}>
              <div>
                <strong>{player.nickname}さん</strong>
                {player.code ? <span>{player.code}</span> : null}
                <span>{player.usedAt ? "使用済み" : "未使用"}</span>
              </div>
              {player.usedAt ? null : (
                <button type="button" disabled={savingId === player.id} onClick={() => void markUsed(player)}>
                  {savingId === player.id ? "記録しています…" : "使用済みにする"}
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
      {error ? <p className="org-game-editor__note">{error}</p> : null}
    </section>
  );
}
