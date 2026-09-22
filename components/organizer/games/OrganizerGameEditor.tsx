"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Loader2,
  Plus,
  Printer,
  Trash2,
} from "lucide-react";
import { OrganizerWorkspacePageHeader } from "@/components/organizer/OrganizerWorkspacePageHeader";
import { GameQrCard } from "@/components/organizer/games/GameQrCard";
import {
  MAX_ORGANIZER_GAME_SPOTS,
  ORGANIZER_GAME_SPOT_KIND_LABEL,
  type OrganizerGameSpotKind,
} from "@/lib/organizer/game-tokens";
import type { OrganizerGame, OrganizerGameSpot } from "@/lib/organizer/games";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

export function OrganizerGameEditor() {
  const params = useParams();
  const gameId = typeof params?.id === "string" ? params.id : "";
  const [game, setGame] = useState<OrganizerGame | null>(null);
  const [spots, setSpots] = useState<OrganizerGameSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerCount, setPlayerCount] = useState(0);
  const [resetting, setResetting] = useState(false);

  const load = useCallback(async () => {
    if (!gameId) return;
    const res = await fetchWithTimeout(`/api/organizer/games/${gameId}`, { cache: "no-store" }, 8000);
    const json = (await res.json().catch(() => ({}))) as {
      error?: string;
      game?: OrganizerGame;
      spots?: OrganizerGameSpot[];
      playerCount?: number;
    };
    if (!res.ok) {
      throw new Error(json.error || "読み込みに失敗しました");
    }
    setGame(json.game as OrganizerGame);
    setSpots((json.spots ?? []) as OrganizerGameSpot[]);
    setPlayerCount(json.playerCount ?? 0);
  }, [gameId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "読み込みに失敗しました");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function addSpot() {
    setAdding(true);
    setError(null);
    try {
      const res = await fetch(`/api/organizer/games/${gameId}/spots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "追加に失敗しました");
        return;
      }
      setSpots((prev) => [...prev, json.spot as OrganizerGameSpot]);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setAdding(false);
    }
  }

  async function patchSpot(
    spotId: string,
    body: { name?: string; kind?: OrganizerGameSpotKind }
  ) {
    setSavingId(spotId);
    setError(null);
    try {
      const res = await fetch(`/api/organizer/games/${gameId}/spots/${spotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "更新に失敗しました");
        return;
      }
      const next = json.spot as OrganizerGameSpot;
      setSpots((prev) => prev.map((s) => (s.id === next.id ? next : s)));
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSavingId(null);
    }
  }

  async function removeSpot(spotId: string) {
    if (!window.confirm("このスポットを削除しますか？")) return;
    setSavingId(spotId);
    setError(null);
    try {
      const res = await fetch(`/api/organizer/games/${gameId}/spots/${spotId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "削除に失敗しました");
        return;
      }
      setSpots((prev) => prev.filter((s) => s.id !== spotId));
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSavingId(null);
    }
  }

  async function moveSpot(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= spots.length) return;
    const order = spots.map((s) => s.id);
    const tmp = order[index];
    order[index] = order[nextIndex];
    order[nextIndex] = tmp;
    const previous = spots;
    setSpots((prev) => {
      const copy = [...prev];
      const item = copy[index];
      copy[index] = copy[nextIndex];
      copy[nextIndex] = item;
      return copy;
    });
    setError(null);
    try {
      const res = await fetch(`/api/organizer/games/${gameId}/spots`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSpots(previous);
        setError(json.error ?? "並び替えに失敗しました");
        return;
      }
      setSpots((json.spots ?? []) as OrganizerGameSpot[]);
    } catch {
      setSpots(previous);
      setError("通信エラーが発生しました");
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#d5e2d8] bg-white px-4 py-12 text-center text-[13px] text-[#566358]">
        ゲームを読み込んでいます…
      </div>
    );
  }

  if (!game) {
    return (
      <div className="space-y-3">
        <p className="text-[13px] text-[#566358]">{error ?? "ゲームが見つかりません"}</p>
        <Link href="/organizer/games" className="text-[13px] font-semibold text-[#2D7A4F]">
          ゲーム機能に戻る
        </Link>
      </div>
    );
  }

  const canAdd = spots.length < MAX_ORGANIZER_GAME_SPOTS;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <Link
        href="/organizer/games"
        className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#2D7A4F] hover:underline"
      >
        <ArrowLeft className="size-3.5" strokeWidth={2.4} aria-hidden />
        ゲーム機能に戻る
      </Link>

      <OrganizerWorkspacePageHeader
        title={game.name}
        subtitle={`${game.typeLabel}のスポットとQRを設定します。参加用QRは1枚、スポット用QRは場所ごとに印刷します。`}
        actions={
          <Link href={`/organizer/games/${game.id}/print`} className="org-games__print-link">
            <Printer className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
            QRをまとめて印刷
          </Link>
        }
      />

      <section className="org-game-editor__panel">
        <h2>参加用QR</h2>
        <p>会場入口やチラシに貼ります。読み込むと、ゲームの参加画面が開きます。</p>
        <GameQrCard
          title="このゲームに参加する"
          caption="ニックネームと合言葉で参加・再開できます。"
          path={game.joinPath}
          filename={`game-join-${game.id}.png`}
        />
        <div className="org-game-editor__play">
          <p>いま {playerCount} 人が参加しています。合言葉を忘れたときは、リセットすると入り直せます。スタンプは残ります。</p>
          <button
            type="button"
            className="org-game-editor__reset"
            disabled={resetting}
            onClick={() => {
              if (
                !window.confirm(
                  "参加中の端末と合言葉を無効にします。同じニックネームで入り直すと、スタンプは残ります。よろしいですか？"
                )
              ) {
                return;
              }
              void (async () => {
                setResetting(true);
                setError(null);
                try {
                  const res = await fetch(`/api/organizer/games/${gameId}/play-reset`, {
                    method: "POST",
                  });
                  const json = await res.json();
                  if (!res.ok) {
                    setError(json.error ?? "リセットに失敗しました");
                    return;
                  }
                } catch {
                  setError("通信エラーが発生しました");
                } finally {
                  setResetting(false);
                }
              })();
            }}
          >
            {resetting ? "リセットしています…" : "合言葉をリセット"}
          </button>
        </div>
      </section>

      <section className="org-game-editor__panel">
        <div className="org-game-editor__panel-head">
          <div>
            <h2>スポット設定</h2>
            <p>巡る場所を追加します。スタンプかゴールを選べます。</p>
          </div>
          <button
            type="button"
            className="org-games__create org-games__create--compact"
            onClick={() => void addSpot()}
            disabled={!canAdd || adding}
          >
            {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Plus className="h-3.5 w-3.5" aria-hidden />}
            スポットを追加
          </button>
        </div>

        {spots.length === 0 ? (
          <div className="org-game-editor__empty">
            <p>まだスポットがありません。会場や商店街の場所を追加しましょう。</p>
          </div>
        ) : (
          <ol className="org-game-spots">
            {spots.map((spot, index) => (
              <li key={spot.id} className="org-game-spot">
                <div className="org-game-spot__row">
                  <div className="org-game-spot__index">{index + 1}</div>
                  <div className="org-game-spot__fields">
                    <label>
                      <span>スポット名</span>
                      <input
                        type="text"
                        defaultValue={spot.name}
                        maxLength={40}
                        disabled={savingId === spot.id}
                        onBlur={(e) => {
                          const name = e.target.value.trim();
                          if (!name || name === spot.name) return;
                          void patchSpot(spot.id, { name });
                        }}
                      />
                    </label>
                    <label>
                      <span>種別</span>
                      <select
                        value={spot.kind}
                        disabled={savingId === spot.id}
                        onChange={(e) =>
                          void patchSpot(spot.id, {
                            kind: e.target.value as OrganizerGameSpotKind,
                          })
                        }
                      >
                        {Object.entries(ORGANIZER_GAME_SPOT_KIND_LABEL).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="org-game-spot__tools">
                    <button
                      type="button"
                      aria-label="上へ"
                      disabled={index === 0}
                      onClick={() => void moveSpot(index, -1)}
                    >
                      <ArrowUp className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label="下へ"
                      disabled={index === spots.length - 1}
                      onClick={() => void moveSpot(index, 1)}
                    >
                      <ArrowDown className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label="削除"
                      onClick={() => void removeSpot(spot.id)}
                      disabled={savingId === spot.id}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
                <GameQrCard
                  title={`${index + 1}. ${spot.name}`}
                  caption={ORGANIZER_GAME_SPOT_KIND_LABEL[spot.kind]}
                  path={spot.path}
                  filename={`game-spot-${spot.id}.png`}
                  size={108}
                />
              </li>
            ))}
          </ol>
        )}
        {!canAdd ? <p className="org-game-editor__note">スポットは{MAX_ORGANIZER_GAME_SPOTS}件までです。</p> : null}
      </section>

      {error ? <p className="org-store-intro__error">{error}</p> : null}
    </div>
  );
}
