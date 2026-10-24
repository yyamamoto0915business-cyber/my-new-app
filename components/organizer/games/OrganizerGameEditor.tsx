"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  CalendarDays,
  Check,
  ExternalLink,
  GripVertical,
  Loader2,
  Lock,
  Plus,
  QrCode,
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
import { gameTypeCover } from "@/components/organizer/games/GameCardSetup";
import {
  MAX_ORGANIZER_GAME_SPOTS,
  ORGANIZER_GAME_SPOT_KIND_LABEL,
  type OrganizerGameSpotKind,
} from "@/lib/organizer/game-tokens";
import type { OrganizerGame, OrganizerGameSpot } from "@/lib/organizer/games";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

/** 作成画面を開き直して、保存した内容を直せるゲーム（スタンプラリーは別の入口）。 */
const DRAFT_EDIT_TYPES = new Set<string>(["quiz", "mystery", "mission", "photo", "checkin"]);

/** 期間を「5/1(木)〜5/31(土)」のように見せる。 */
function formatPeriod(startsAt: string | null, endsAt: string | null): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", weekday: "short", timeZone: "Asia/Tokyo" });
  if (startsAt && endsAt) return `${fmt(startsAt)} 〜 ${fmt(endsAt)}`;
  if (startsAt) return `${fmt(startsAt)} から`;
  if (endsAt) return `${fmt(endsAt)} まで`;
  return "期間の指定なし";
}

/** 一番上の状態のカード、公開前の QR の場所、参加している人の欄。 */
const EDITOR_CSS = `
.ge-hero { position: relative; overflow: hidden; display: grid; gap: 0.95rem; border-radius: 1.25rem; border: 1px solid #eadcb9; background: linear-gradient(135deg, #fffdf6 0%, #fff6e2 100%); padding: 1rem; box-shadow: 0 10px 28px -18px rgba(120, 90, 20, 0.45); }
.ge-hero.is-live { border-color: #c4e2cf; background: linear-gradient(135deg, #fbfffc 0%, #e9f6ee 100%); box-shadow: 0 10px 28px -18px rgba(30, 100, 60, 0.45); }
.ge-hero__top { display: flex; align-items: center; gap: 0.9rem; }
.ge-hero__cover { flex: none; width: 92px; height: 92px; border-radius: 1rem; object-fit: cover; background: #f1ead6; box-shadow: 0 6px 16px -8px rgba(0, 0, 0, 0.35); }
.ge-hero__info { min-width: 0; display: grid; gap: 0.3rem; }
.ge-hero__badge { justify-self: start; display: inline-flex; align-items: center; gap: 0.4rem; border-radius: 999px; background: #fff; border: 1px solid #e6d3a6; padding: 0.2rem 0.7rem 0.2rem 0.55rem; font-size: 0.75rem; font-weight: 800; color: #8a6418; }
.ge-hero__badge i { width: 0.5rem; height: 0.5rem; border-radius: 999px; background: #c9972f; }
.ge-hero.is-live .ge-hero__badge { border-color: #bfe0cb; color: #1f6b43; }
.ge-hero.is-live .ge-hero__badge i { background: #2d9a5c; box-shadow: 0 0 0 0 rgba(45, 154, 92, 0.5); animation: ge-pulse 1.8s ease-out infinite; }
@keyframes ge-pulse { 0% { box-shadow: 0 0 0 0 rgba(45, 154, 92, 0.5); } 100% { box-shadow: 0 0 0 8px rgba(45, 154, 92, 0); } }
.ge-hero__lead { margin: 0; font-size: 0.95rem; font-weight: 700; color: #2b3a2e; }
.ge-hero__period { display: inline-flex; align-items: center; gap: 0.3rem; margin: 0; font-size: 0.78rem; color: #6a7568; }
.ge-steps { display: flex; align-items: center; margin: 0; padding: 0; list-style: none; }
.ge-steps li { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.3rem; position: relative; font-size: 0.72rem; font-weight: 700; color: #9aa39b; }
.ge-steps li + li::before { content: ""; position: absolute; top: 0.7rem; right: 50%; width: 100%; height: 2px; background: #e8dfc9; z-index: 0; }
.ge-steps li.is-done + li::before { background: #c9972f; }
.ge-steps span { position: relative; z-index: 1; display: grid; place-items: center; width: 1.4rem; height: 1.4rem; border-radius: 999px; background: #fff; border: 2px solid #e2d8bf; font-size: 0.7rem; }
.ge-steps li.is-done { color: #8a6418; }
.ge-steps li.is-done span { background: #c9972f; border-color: #c9972f; color: #fff; }
.ge-steps li.is-now { color: #2b3a2e; }
.ge-steps li.is-now span { border-color: #2d7a4f; color: #2d7a4f; box-shadow: 0 0 0 4px rgba(45, 122, 79, 0.12); }
.ge-hero__actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.55rem; }
.ge-hero__actions > :only-child { grid-column: 1 / -1; }
.ge-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; min-height: 48px; border-radius: 0.9rem; border: 1px solid #d6e3da; background: #fff; padding: 0.5rem 0.9rem; font-size: 0.9rem; font-weight: 700; color: #1a4d32; text-decoration: none; transition: transform 0.12s ease, box-shadow 0.12s ease; }
.ge-btn:active { transform: scale(0.98); }
.ge-btn:disabled { opacity: 0.6; }
.ge-btn--primary { border-color: transparent; background: linear-gradient(180deg, #34895a 0%, #276b45 100%); color: #fff; box-shadow: 0 6px 14px -6px rgba(39, 107, 69, 0.7); }
.ge-hero__tools { display: flex; flex-wrap: wrap; gap: 0.35rem 1.1rem; border-top: 1px solid rgba(0, 0, 0, 0.06); padding-top: 0.75rem; }
.ge-hero__tools a, .ge-hero__tools button { display: inline-flex; align-items: center; gap: 0.3rem; border: 0; background: none; padding: 0.2rem 0; font-size: 0.8rem; font-weight: 700; color: #3d6b50; text-decoration: none; }
.ge-hero__tools button { color: #8a3b3b; }
.ge-locked { display: flex; align-items: center; gap: 0.85rem; border-radius: 1.1rem; border: 1.5px dashed #d6e3da; background: rgba(255, 255, 255, 0.7); padding: 0.95rem 1rem; }
.ge-locked__icon { position: relative; flex: none; display: grid; place-items: center; width: 3rem; height: 3rem; border-radius: 0.9rem; background: #eef4f0; color: #8aa293; }
.ge-locked__lock { position: absolute; right: -0.3rem; bottom: -0.3rem; box-sizing: content-box; padding: 0.2rem; border-radius: 999px; background: #fff; color: #6a7568; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15); }
.ge-locked h2 { margin: 0; font-size: 0.9rem; font-weight: 700; color: #3d4a3f; }
.ge-locked p { margin: 0.2rem 0 0; font-size: 0.75rem; line-height: 1.55; color: #7a857b; }
.ge-players { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; margin-top: 0.6rem; }
.ge-players__count { display: inline-flex; align-items: baseline; gap: 0.25rem; color: #1a4d32; }
.ge-players__count svg { align-self: center; }
.ge-players__count b { font-size: 1.6rem; font-variant-numeric: tabular-nums; }
.ge-players__count span { font-size: 0.8rem; font-weight: 700; }
.ge-players p { flex: 1 1 14rem; margin: 0; font-size: 0.75rem; line-height: 1.6; color: #6a7568; }
@media (min-width: 640px) {
  .ge-hero { padding: 1.25rem; }
  .ge-hero__cover { width: 112px; height: 112px; }
  .ge-hero__actions { display: flex; }
  .ge-hero__actions .ge-btn { min-width: 10rem; }
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
  /** まちの情報のカードに出す画像（主催者が選んだもの）。なければ種類の絵。 */
  const [cardImage, setCardImage] = useState("");

  const load = useCallback(async () => {
    if (!gameId) return;
    const res = await fetchWithTimeout(`/api/organizer/games/${gameId}`, { cache: "no-store" }, 8000);
    const json = (await res.json().catch(() => ({}))) as {
      error?: string;
      game?: OrganizerGame;
      spots?: OrganizerGameSpot[];
      playerCount?: number;
      settings?: { cardImage?: unknown };
    };
    if (!res.ok) {
      throw new Error(json.error || "読み込みに失敗しました");
    }
    setGame(json.game as OrganizerGame);
    setSpots((json.spots ?? []) as OrganizerGameSpot[]);
    setPlayerCount(json.playerCount ?? 0);
    setCardImage(typeof json.settings?.cardImage === "string" ? json.settings.cardImage : "");
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
  const periodLabel = formatPeriod(game.startsAt, game.endsAt);
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
        subtitle={game.eventTitle ? `${game.typeLabel}・${game.eventTitle}` : game.typeLabel}
      />

      <style>{EDITOR_CSS}</style>
      {error ? <p className="org-store-intro__error">{error}</p> : null}

      <section className={`ge-hero${live ? " is-live" : ""}`}>
        <div className="ge-hero__top">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="ge-hero__cover" src={cardImage || gameTypeCover(game.type)} alt="" />
          <div className="ge-hero__info">
            <span className="ge-hero__badge">
              <i aria-hidden />
              {live ? "公開中" : "下書き"}
            </span>
            <p className="ge-hero__lead">
              {live ? "参加者が遊べる状態です。" : "まだ参加者には見えません。"}
            </p>
            <p className="ge-hero__period">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              {periodLabel}
            </p>
          </div>
        </div>

        {live ? null : (
          <ol className="ge-steps" aria-label="公開までの流れ">
            <li className="is-done">
              <span>
                <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
              </span>
              作成
            </li>
            <li className="is-now">
              <span>2</span>
              内容を確かめる
            </li>
            <li>
              <span>3</span>
              公開
            </li>
          </ol>
        )}

        <div className="ge-hero__actions">
          {live ? (
            <a href={game.joinPath} target="_blank" rel="noreferrer" className="ge-btn ge-btn--primary">
              <ExternalLink className="h-4 w-4" aria-hidden />
              参加画面を開く
            </a>
          ) : (
            <button type="button" className="ge-btn ge-btn--primary" disabled={publishing} onClick={() => void changeStatus("published")}>
              {publishing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {publishing ? "公開しています…" : "公開する"}
            </button>
          )}
          {editHref ? (
            <Link href={editHref} className="ge-btn">
              <PenLine className="h-4 w-4" aria-hidden />
              {game.type === "stamp" ? "画面と特典を直す" : "内容を直す"}
            </Link>
          ) : null}
        </div>

        <div className="ge-hero__tools">
          <Link href={`/organizer/games/${game.id}/analytics`}>
            <BarChart3 className="h-3.5 w-3.5" aria-hidden />
            データを見る
          </Link>
          <Link href={`/organizer/games/${game.id}/print`}>
            <Printer className="h-3.5 w-3.5" aria-hidden />
            QRを印刷
          </Link>
          {live ? (
            <button type="button" disabled={publishing} onClick={() => void changeStatus("draft")}>
              非公開に戻す
            </button>
          ) : null}
        </div>
      </section>

      {live ? (
        <section className="org-game-editor__panel">
          <h2>参加のしかた</h2>
          <p>会場の入口やチラシにQRを貼ります。QRを読めない人には、参加コードを伝えてください。</p>
          <GameQrCard
            title="参加用QR"
            caption="ニックネームと合言葉で参加・再開できます。"
            path={game.joinPath}
            filename={`game-join-${game.id}.png`}
          />
          <GameJoinCodePanel gameId={game.id} published={live} />
        </section>
      ) : (
        <section className="ge-locked">
          <span className="ge-locked__icon">
            <QrCode className="h-6 w-6" aria-hidden />
            <Lock className="ge-locked__lock h-3.5 w-3.5" aria-hidden />
          </span>
          <div>
            <h2>参加用QRと参加コード</h2>
            <p>公開すると、ここに出ます。会場に貼るQRと、口頭で伝える6文字のコードです。</p>
          </div>
        </section>
      )}

      {live || playerCount > 0 ? (
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
      ) : null}

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
