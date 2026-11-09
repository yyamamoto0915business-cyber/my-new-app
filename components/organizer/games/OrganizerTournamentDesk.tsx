"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, RotateCcw, X } from "lucide-react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { TournamentBoard } from "@/components/play/PlayTournament";
import type { TournamentMatch, TournamentView } from "@/lib/organizer/tournament";

/** トーナメント表の管理（試合を押して結果を入れる・名前を直す） */
export function OrganizerTournamentDesk({ gameId, gameType }: { gameId: string; gameType: string }) {
  const [view, setView] = useState<TournamentView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState<TournamentMatch | null>(null);
  const [scoreA, setScoreA] = useState("");
  const [scoreB, setScoreB] = useState("");
  const [renaming, setRenaming] = useState(false);

  const request = useCallback(
    async (method: "GET" | "POST", body?: unknown, busyKey: string | null = null) => {
      setBusy(busyKey);
      setError(null);
      try {
        const res = await fetchWithTimeout(
          `/api/organizer/games/${gameId}/tournament`,
          {
            method,
            cache: "no-store",
            headers: body ? { "Content-Type": "application/json" } : undefined,
            body: body ? JSON.stringify(body) : undefined,
          },
          10000,
        );
        const json = (await res.json().catch(() => ({}))) as { view?: TournamentView; error?: string };
        if (!res.ok || !json.view) throw new Error(json.error || "保存できませんでした");
        setView(json.view);
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "保存できませんでした");
        return false;
      } finally {
        setBusy(null);
      }
    },
    [gameId],
  );

  useEffect(() => {
    if (gameType !== "tournament" || !gameId) return;
    void request("GET");
  }, [gameId, gameType, request]);

  if (gameType !== "tournament") return null;
  if (!view) {
    return (
      <section className="org-game-editor__panel">
        <h2>トーナメント表</h2>
        {error ? <p className="org-game-editor__note">{error}</p> : <p className="org-game-editor__empty">読み込み中…</p>}
      </section>
    );
  }

  function pick(match: TournamentMatch) {
    setOpen(match);
    setScoreA(match.scoreA !== null ? String(match.scoreA) : "");
    setScoreB(match.scoreB !== null ? String(match.scoreB) : "");
  }

  async function save(result: { winner?: number; draw?: boolean }) {
    if (!open) return;
    const ok = await request(
      "POST",
      { action: "result", key: open.key, ...result, scoreA: scoreA === "" ? null : Number(scoreA), scoreB: scoreB === "" ? null : Number(scoreB) },
      "result",
    );
    if (ok) setOpen(null);
  }

  async function clear() {
    if (!open) return;
    if (!window.confirm("この試合の結果を消しますか？")) return;
    if (await request("POST", { action: "clear", key: open.key }, "clear")) setOpen(null);
  }

  async function reset() {
    if (!window.confirm("すべての試合の結果を消して、はじめからにしますか？この操作は元に戻せません。")) return;
    await request("POST", { action: "reset" }, "reset");
  }

  async function rename(index: number) {
    const current = view?.entrants[index] ?? "";
    const next = window.prompt("新しい名前", current);
    if (next === null || next.trim() === "" || next.trim() === current) return;
    await request("POST", { action: "rename", index, name: next }, `rename-${index}`);
  }

  const name = (i: number | null) => (i === null ? "未定" : view.entrants[i]);
  const scoreField =
    "w-[72px] rounded-lg border border-[#d8e4dc] px-2 py-2 text-center text-[16px] tabular-nums outline-none focus:border-[#7b4fc9]";

  return (
    <section className="org-game-editor__panel">
      <div className="org-game-editor__panel-head">
        <div>
          <h2>トーナメント表</h2>
          <p>
            {view.format === "knockout" ? "勝ち抜き" : "リーグ戦"} ・ 出場 {view.entrants.length} ・ {view.done}/{view.total} 試合おわり
          </p>
        </div>
      </div>
      {error ? <p className="mb-3 rounded-xl bg-[#fdecec] px-3 py-2 text-[12.5px] text-[#b91c1c]">{error}</p> : null}
      <p className="mb-3 text-[12px] text-[#6a7a70]">試合を押すと、勝った方とスコアを入れられます。参加者の画面にも、そのまま出ます。</p>

      <TournamentBoard view={view} onPick={pick} />

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setRenaming((v) => !v)}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-[#e3e8e2] px-4 text-[12.5px] font-semibold text-[#4a5a50]"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          {renaming ? "名前の直しを閉じる" : "出場者の名前を直す"}
        </button>
        {view.done > 0 ? (
          <button
            type="button"
            onClick={() => void reset()}
            disabled={busy !== null}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3 text-[12.5px] text-[#8a978f] hover:text-[#b91c1c] disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            結果をすべて消す
          </button>
        ) : null}
      </div>
      {renaming ? (
        <ul className="mt-2 grid grid-cols-1 gap-1.5 min-[600px]:grid-cols-2">
          {view.entrants.map((n, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => void rename(i)}
                disabled={busy !== null}
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-[#e8ece6] px-3 py-2 text-left text-[13px] disabled:opacity-50"
              >
                <span className="min-w-0 truncate">
                  <span className="mr-2 text-[11px] text-[#8a978f]">{i + 1}</span>
                  {n}
                </span>
                <Pencil className="h-3.5 w-3.5 shrink-0 text-[#8a978f]" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/30 p-0 min-[600px]:items-center min-[600px]:p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-[420px] rounded-t-2xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl min-[600px]:rounded-2xl">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-bold text-[#7b4fc9]">{open.roundLabel}</p>
              <button type="button" onClick={() => setOpen(null)} aria-label="閉じる" className="rounded-full p-1.5 text-[#8a978f]">
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <p className="mt-1 text-[12.5px] text-[#6a7a70]">勝った方を押してください。スコアは入れなくてもかまいません。</p>
            <div className="mt-3 space-y-2">
              {(
                [
                  [open.a, scoreA, setScoreA],
                  [open.b, scoreB, setScoreB],
                ] as const
              ).map(([idx, score, setScore], i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => idx !== null && void save({ winner: idx })}
                    disabled={busy !== null || idx === null}
                    className={`flex min-h-[52px] min-w-0 flex-1 items-center justify-between rounded-xl border px-3.5 text-left text-[15px] font-bold transition disabled:opacity-50 ${
                      open.winner === idx && idx !== null ? "border-[#2e8a5a] bg-[#eaf4ee] text-[#1e5a3a]" : "border-[#e3e8e2] text-[#1e3828] hover:border-[#7b4fc9]"
                    }`}
                  >
                    <span className="min-w-0 truncate">{name(idx)}</span>
                    <span className="ml-2 shrink-0 text-[11.5px] font-semibold text-[#7b4fc9]">勝ち</span>
                  </button>
                  <input
                    value={score}
                    onChange={(e) => setScore(e.target.value.replace(/[^\d]/g, "").slice(0, 3))}
                    inputMode="numeric"
                    placeholder="点"
                    aria-label={`${name(idx)} のスコア`}
                    className={scoreField}
                  />
                </div>
              ))}
            </div>
            {view.format === "league" ? (
              <button
                type="button"
                onClick={() => void save({ draw: true })}
                disabled={busy !== null}
                className="mt-2 min-h-[44px] w-full rounded-xl border border-[#e3e8e2] text-[14px] font-semibold text-[#4a5a50] disabled:opacity-50"
              >
                引き分け
              </button>
            ) : null}
            {open.winner !== null || open.draw ? (
              <button
                type="button"
                onClick={() => void clear()}
                disabled={busy !== null}
                className="mx-auto mt-3 block text-[12.5px] text-[#8a978f] hover:text-[#b91c1c]"
              >
                この試合の結果を消す
              </button>
            ) : null}
            {busy ? <p className="mt-2 text-center text-[12px] text-[#6a7a70]">保存しています…</p> : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
