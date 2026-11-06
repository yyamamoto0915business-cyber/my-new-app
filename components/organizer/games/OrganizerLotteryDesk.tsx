"use client";

import { useCallback, useEffect, useState } from "react";
import { Dices, Gift, RotateCcw, Users, X } from "lucide-react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { LotteryPhase } from "@/lib/organizer/lottery";
import type { LotteryAdminState } from "@/lib/organizer/lottery-play";

/** 抽選ゲームの管理（参加した人・賞ごとの抽選・結果発表の切りかえ） */
export function OrganizerLotteryDesk({ gameId, gameType }: { gameId: string; gameType: string }) {
  const [state, setState] = useState<LotteryAdminState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [showEntrants, setShowEntrants] = useState(false);
  /** いま抽選した賞（当選者を目立たせる） */
  const [justDrawn, setJustDrawn] = useState<number | null>(null);

  const request = useCallback(
    async (method: "GET" | "POST", body?: unknown, busyKey: string | null = null) => {
      setBusy(busyKey);
      setError(null);
      try {
        const res = await fetchWithTimeout(
          `/api/organizer/games/${gameId}/lottery`,
          {
            method,
            cache: "no-store",
            headers: body ? { "Content-Type": "application/json" } : undefined,
            body: body ? JSON.stringify(body) : undefined,
          },
          10000,
        );
        const json = (await res.json().catch(() => ({}))) as LotteryAdminState & { error?: string };
        if (!res.ok) throw new Error(json.error || "保存できませんでした");
        setState(json);
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
    if (gameType !== "lottery" || !gameId) return;
    void request("GET");
  }, [gameId, gameType, request]);

  if (gameType !== "lottery") return null;
  if (!state) {
    return (
      <section className="org-game-editor__panel">
        <h2>抽選</h2>
        {error ? <p className="org-game-editor__note">{error}</p> : <p className="org-game-editor__empty">読み込み中…</p>}
      </section>
    );
  }

  const drawnTotal = state.prizes.reduce((sum, p) => sum + p.winners.length, 0);

  async function draw(index: number) {
    const prize = state?.prizes[index];
    if (!prize) return;
    if (!window.confirm(`「${prize.label}」を抽選しますか？`)) return;
    if (await request("POST", { action: "draw", prizeIndex: index }, `draw-${index}`)) setJustDrawn(index);
  }

  async function voidWin(winId: string, nickname: string) {
    if (
      !window.confirm(
        `${nickname} さんの当選を取り消しますか？\nその場にいないときなどに使います。取り消したあと、もう一度「抽選する」を押すと、空いた枠をほかの人から選びます。`,
      )
    )
      return;
    await request("POST", { action: "void", winId }, winId);
  }

  async function changePhase(next: LotteryPhase) {
    const message =
      next === "result"
        ? "結果を発表しますか？参加者の画面に、当たり・はずれが出ます。"
        : "受付中に戻しますか？参加者の画面から結果が見えなくなります。";
    if (!window.confirm(message)) return;
    await request("POST", { action: "phase", phase: next }, "phase");
  }

  async function reset() {
    if (!window.confirm("当選をすべて消して、はじめからやり直しますか？この操作は元に戻せません。")) return;
    await request("POST", { action: "reset" }, "reset");
    setJustDrawn(null);
  }

  return (
    <section className="org-game-editor__panel">
      <div className="org-game-editor__panel-head">
        <div>
          <h2>抽選</h2>
          <p>
            参加した人 {state.entrants.length}人 ・ 当選 {drawnTotal}人 ・{" "}
            {state.phase === "result" ? "結果発表中" : "受付中"}
          </p>
        </div>
      </div>

      {error ? <p className="mb-3 rounded-xl bg-[#fdecec] px-3 py-2 text-[12.5px] text-[#b91c1c]">{error}</p> : null}

      <ul className="space-y-3">
        {state.prizes.map((prize, index) => {
          const open = prize.count - prize.winners.length;
          return (
            <li
              key={`${prize.label}-${index}`}
              className={`rounded-2xl border px-4 py-3 transition ${
                justDrawn === index ? "border-[#d9534f] bg-[#fff6f5]" : "border-[#e3e8e2] bg-white"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Gift className="h-4 w-4 shrink-0 text-[#d9534f]" aria-hidden />
                  <p className="min-w-0 text-[14.5px] font-bold text-[#1e3828]">{prize.label}</p>
                  <span className="shrink-0 text-[12px] text-[#6a7a70]">
                    {prize.winners.length}/{prize.count}人
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void draw(index)}
                  disabled={busy !== null || open <= 0 || state.remaining === 0}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-[#d9534f] px-4 text-[13px] font-bold text-white disabled:opacity-40"
                >
                  <Dices className="h-4 w-4" aria-hidden />
                  {busy === `draw-${index}` ? "抽選中…" : open <= 0 ? "決定済み" : prize.winners.length > 0 ? `あと${open}人を抽選` : "抽選する"}
                </button>
              </div>
              {prize.winners.length > 0 ? (
                <ul className="mt-2.5 flex flex-wrap gap-1.5">
                  {prize.winners.map((w) => (
                    <li
                      key={w.winId}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#f1c9c6] bg-white py-1 pl-3 pr-1 text-[13px] font-semibold text-[#3a1a18]"
                    >
                      <span className="text-[11px] font-normal text-[#a0605c]">No.{w.entryNumber}</span>
                      {w.nickname}
                      <button
                        type="button"
                        onClick={() => void voidWin(w.winId, w.nickname)}
                        disabled={busy !== null}
                        aria-label={`${w.nickname} さんの当選を取り消す`}
                        className="flex h-6 w-6 items-center justify-center rounded-full text-[#a0605c] hover:bg-[#fdecec] disabled:opacity-40"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>

      {state.entrants.length === 0 ? (
        <p className="mt-3 text-[12.5px] text-[#6a7a70]">
          まだ参加した人がいません。参加用の QR や参加コードを案内してください。
        </p>
      ) : state.remaining === 0 && drawnTotal < state.prizes.reduce((s, p) => s + p.count, 0) ? (
        <p className="mt-3 text-[12.5px] text-[#6a7a70]">参加した人は全員、どれかの賞に当たっています。</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {state.phase === "entry" ? (
          <button
            type="button"
            onClick={() => void changePhase("result")}
            disabled={busy !== null || drawnTotal === 0}
            className="inline-flex min-h-[44px] items-center rounded-full bg-[#1e3828] px-5 text-[13.5px] font-bold text-white disabled:opacity-40"
          >
            {busy === "phase" ? "切りかえ中…" : "結果を発表する"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void changePhase("entry")}
            disabled={busy !== null}
            className="inline-flex min-h-[44px] items-center rounded-full border border-[#1e3828] px-5 text-[13.5px] font-bold text-[#1e3828] disabled:opacity-40"
          >
            {busy === "phase" ? "切りかえ中…" : "結果を隠して受付中に戻す"}
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowEntrants((v) => !v)}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-[#e3e8e2] px-4 text-[13px] font-semibold text-[#4a5a50]"
        >
          <Users className="h-4 w-4" aria-hidden />
          {showEntrants ? "参加した人を閉じる" : "参加した人を見る"}
        </button>
        {drawnTotal > 0 ? (
          <button
            type="button"
            onClick={() => void reset()}
            disabled={busy !== null}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-[12.5px] text-[#8a978f] hover:text-[#b91c1c] disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            はじめからやり直す
          </button>
        ) : null}
      </div>
      <p className="mt-2 text-[11.5px] leading-relaxed text-[#6a7a70]">
        抽選しても、「結果を発表する」を押すまで参加者には見えません。1人が当たるのは1つの賞までです。
      </p>

      {showEntrants ? (
        <ul className="mt-3 max-h-[320px] divide-y divide-[#f0f2ee] overflow-y-auto rounded-xl border border-[#e8ece6]">
          {state.entrants.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 px-3 py-2 text-[13px]">
              <span className="min-w-0 truncate">
                <span className="mr-2 text-[11px] text-[#8a978f]">No.{p.entryNumber}</span>
                {p.nickname}
              </span>
              {p.winning ? (
                <span className="shrink-0 rounded-full bg-[#fff0ef] px-2 py-0.5 text-[11px] font-semibold text-[#d9534f]">
                  {p.winning}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
