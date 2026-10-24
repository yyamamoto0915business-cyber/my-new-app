"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  ExternalLink,
  GripVertical,
  Loader2,
  Plus,
  PenLine,
  Printer,
  Trash2,
  Users,
} from "lucide-react";
import { OrganizerWorkspacePageHeader } from "@/components/organizer/OrganizerWorkspacePageHeader";
import { GameQrCard } from "@/components/organizer/games/GameQrCard";
import { OrganizerCouponUses } from "@/components/organizer/games/OrganizerCouponUses";
import { OrganizerMissionPhotos } from "@/components/organizer/games/OrganizerMissionPhotos";
import { GameJoinCodePanel } from "@/components/organizer/games/GameJoinCodePanel";
import {
  MAX_ORGANIZER_GAME_SPOTS,
  ORGANIZER_GAME_SPOT_KIND_LABEL,
  type OrganizerGameSpotKind,
} from "@/lib/organizer/game-tokens";
import type { OrganizerGame, OrganizerGameSpot } from "@/lib/organizer/games";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

/** 作成画面を開き直して、保存した内容を直せるゲーム（スタンプラリーは別の入口）。 */
const DRAFT_EDIT_TYPES = new Set<string>(["quiz", "mystery", "mission", "photo", "checkin"]);

/** 状態のカードと、参加している人の欄。 */
const EDITOR_CSS = `
.ge-status { display: grid; gap: 0.8rem; border-color: #ecdcb8; background: #fffaf0; }
.ge-status.is-live { border-color: #bfe0cb; background: #f2faf5; }
.ge-status__head { display: flex; align-items: flex-start; gap: 0.6rem; }
.ge-status__badge { flex: none; border-radius: 999px; background: #b8892f; padding: 0.2rem 0.65rem; font-size: 0.75rem; font-weight: 800; color: #fff; }
.ge-status.is-live .ge-status__badge { background: #2d7a4f; }
.ge-status__text { margin: 0; font-size: 0.85rem; line-height: 1.55; color: #3d4a3f; }
.ge-status__actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.ge-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem; min-height: 44px; border-radius: 0.8rem; border: 1px solid #cfe0d5; background: #fff; padding: 0.45rem 0.95rem; font-size: 0.85rem; font-weight: 700; color: #1a4d32; text-decoration: none; }
.ge-btn:disabled { opacity: 0.6; }
.ge-btn--primary { border-color: transparent; background: #2d7a4f; color: #fff; }
.ge-btn--quiet { color: #8a3b3b; border-color: #e6cfcf; }
.ge-muted .org-game-qr { opacity: 0.55; }
.ge-muted .org-game-editor__panel { opacity: 0.75; }
.ge-players { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; margin-top: 0.6rem; }
.ge-players__count { display: inline-flex; align-items: baseline; gap: 0.25rem; color: #1a4d32; }
.ge-players__count svg { align-self: center; }
.ge-players__count b { font-size: 1.6rem; font-variant-numeric: tabular-nums; }
.ge-players__count span { font-size: 0.8rem; font-weight: 700; }
.ge-players p { flex: 1 1 14rem; margin: 0; font-size: 0.75rem; line-height: 1.6; color: #6a7568; }
@media (max-width: 520px) {
  .ge-status__actions .ge-btn { flex: 1 1 auto; }
}
`;

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
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [publishing, setPublishing] = useState(false);

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

  async function changeStatus(status: "published" | "draft") {
    if (!game || game.status === status) return;
    if (
      status === "draft" &&
      !window.confirm("非公開にすると、参加用QRと参加コードから入れなくなります。参加中の人の記録は残ります。よろしいですか？")
    ) {
      return;
    }
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch(`/api/organizer/games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = (await res.json()) as { error?: string; game?: OrganizerGame };
      if (!res.ok || !json.game) {
        setError(json.error ?? (status === "published" ? "公開できませんでした" : "非公開にできませんでした"));
        return;
      }
      setGame(json.game);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setPublishing(false);
    }
  }

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
    await reorderSpots(index, index + direction);
  }

  async function reorderSpots(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= spots.length || to >= spots.length) return;
    const order = spots.map((s) => s.id);
    const [moved] = order.splice(from, 1);
    order.splice(to, 0, moved);
    const previous = spots;
    setSpots((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
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
  const live = game.status === "published";
  const editHref =
    game.type === "stamp"
      ? `/organizer/games/new?edit=${game.id}`
      : DRAFT_EDIT_TYPES.has(game.type)
        ? `/organizer/games/new?type=${game.type}&edit=${game.id}`
        : null;

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
        subtitle={game.typeLabel}
        actions={
          <>
            <Link href={`/organizer/games/${game.id}/analytics`} className="org-games__print-link">
              <BarChart3 className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
              データを見る
            </Link>
            <Link href={`/organizer/games/${game.id}/print`} className="org-games__print-link">
              <Printer className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden />
              QRを印刷
            </Link>
          </>
        }
      />

      <style>{EDITOR_CSS}</style>
      {error ? <p className="org-store-intro__error">{error}</p> : null}
      <section className={`org-game-editor__panel ge-status${live ? " is-live" : ""}`}>
        <div className="ge-status__head">
          <span className="ge-status__badge">{live ? "公開中" : "下書き"}</span>
          <p className="ge-status__text">
            {live
              ? "参加用QRと参加コードから入れます。まちの情報にも載っています。"
              : "まだ参加者には見えません。内容を確かめてから公開しましょう。"}
          </p>
        </div>
        <div className="ge-status__actions">
          {editHref ? (
            <Link href={editHref} className="ge-btn">
              <PenLine className="h-4 w-4" aria-hidden />
              {game.type === "stamp" ? "画面と特典を直す" : "内容を直す"}
            </Link>
          ) : null}
          {live ? (
            <>
              <a href={game.joinPath} target="_blank" rel="noreferrer" className="ge-btn">
                <ExternalLink className="h-4 w-4" aria-hidden />
                参加画面を開く
              </a>
              <button type="button" className="ge-btn ge-btn--quiet" disabled={publishing} onClick={() => void changeStatus("draft")}>
                {publishing ? "切りかえています…" : "非公開に戻す"}
              </button>
            </>
          ) : (
            <button type="button" className="ge-btn ge-btn--primary" disabled={publishing} onClick={() => void changeStatus("published")}>
              {publishing ? "公開しています…" : "公開する"}
            </button>
          )}
        </div>
      </section>

      <section className={`org-game-editor__panel${live ? "" : " ge-muted"}`}>
        <h2>参加のしかた</h2>
        <p>
          {live
            ? "会場の入口やチラシにQRを貼ります。QRを読めない人には、参加コードを伝えてください。"
            : "公開すると使えます。下書きのあいだは、読みこんでも参加画面は開きません。"}
        </p>
        <GameQrCard
          title="参加用QR"
          caption="ニックネームと合言葉で参加・再開できます。"
          path={game.joinPath}
          filename={`game-join-${game.id}.png`}
        />
        <GameJoinCodePanel gameId={game.id} published={live} />
      </section>

      <section className="org-game-editor__panel">
        <h2>参加している人</h2>
        <div className="ge-players">
          <div className="ge-players__count">
            <Users className="h-5 w-5" aria-hidden />
            <b>{playerCount}</b>
            <span>人</span>
          </div>
          <p>合言葉を忘れた人がいたら、リセットすると同じニックネームで入り直せます。記録は残ります。</p>
          <button
            type="button"
            className="org-game-editor__reset"
            disabled={resetting || playerCount === 0}
            onClick={() => {
              if (
                !window.confirm(
                  "参加中の端末と合言葉を無効にします。同じニックネームで入り直すと、記録は残ります。よろしいですか？"
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

      <OrganizerCouponUses gameId={game.id} gameType={game.type} />
      <OrganizerMissionPhotos gameId={game.id} gameType={game.type} />

      {game.type === "stamp" ? (
      <section className="org-game-editor__panel">
        <div className="org-game-editor__panel-head">
          <div>
            <h2>スポット設定</h2>
            <p className="org-game-editor__note">ドラッグしても、上下ボタンでも並べ替えられます。</p>
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
              <li
              key={spot.id}
              className="org-game-spot"
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (dragIndex != null) void reorderSpots(dragIndex, index);
                setDragIndex(null);
              }}
              onDragEnd={() => setDragIndex(null)}
            >
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
                    <span aria-hidden>
                      <GripVertical className="h-4 w-4" />
                    </span>
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
      ) : null}

    </div>
  );
}
