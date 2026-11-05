"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, Flag, Loader2, Plus, Star, StarOff, Trophy } from "lucide-react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { VOTE_BODY_MAX, VOTE_PHASES, type VotePhase } from "@/lib/organizer/vote";
import type { VoteAdminIdea, VoteAdminState } from "@/lib/organizer/vote-play";

type Filter = "all" | "candidate" | "hidden";

/** 投票ゲームの管理：届いた案から候補を選び、段階（案を集める → 投票 → 結果）を切りかえる */
export function OrganizerVoteDesk({ gameId, gameType }: { gameId: string; gameType: string }) {
  const [state, setState] = useState<VoteAdminState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [candidate, setCandidate] = useState("");

  const request = useCallback(
    async (method: "GET" | "PATCH" | "POST", body?: unknown, busyKey: string | null = null) => {
      setBusy(busyKey);
      setError(null);
      try {
        const res = await fetchWithTimeout(
          `/api/organizer/games/${gameId}/vote`,
          {
            method,
            cache: "no-store",
            headers: body ? { "Content-Type": "application/json" } : undefined,
            body: body ? JSON.stringify(body) : undefined,
          },
          10000,
        );
        const json = (await res.json().catch(() => ({}))) as VoteAdminState & { error?: string };
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
    if (gameType !== "vote" || !gameId) return;
    void request("GET");
  }, [gameId, gameType, request]);

  if (gameType !== "vote") return null;
  if (!state) {
    return (
      <section className="org-game-editor__panel">
        <h2>投票の管理</h2>
        {error ? <p className="org-game-editor__note">{error}</p> : <p className="org-game-editor__empty">読み込み中…</p>}
      </section>
    );
  }

  const phase = state.settings.phase;
  const candidates = state.ideas.filter((idea) => idea.isCandidate && !idea.hidden);
  const shown = state.ideas.filter((idea) =>
    filter === "candidate" ? idea.isCandidate : filter === "hidden" ? idea.hidden : true,
  );

  async function changePhase(next: VotePhase) {
    const label = VOTE_PHASES.find((p) => p.id === next)?.label ?? next;
    if (!window.confirm(`「${label}」に切りかえますか？参加者の画面もすぐ変わります。`)) return;
    await request("POST", { action: "phase", phase: next }, `phase-${next}`);
  }

  async function addCandidate(e: React.FormEvent) {
    e.preventDefault();
    if (!candidate.trim()) return;
    if (await request("POST", { action: "candidate", body: candidate }, "candidate")) setCandidate("");
  }

  function patch(idea: VoteAdminIdea, change: { hidden?: boolean; isCandidate?: boolean }) {
    void request("PATCH", { ideaId: idea.id, ...change }, idea.id);
  }

  return (
    <section className="org-game-editor__panel">
      <div className="org-game-editor__panel-head">
        <div>
          <h2>投票の管理</h2>
          <p>
            届いた案 {state.ideas.filter((i) => !i.hidden).length}件 ・ 候補 {candidates.length}件 ・ 投票した人 {state.voterCount}人
          </p>
        </div>
      </div>

      <ol className="mb-4 grid grid-cols-3 gap-2" aria-label="段階">
        {VOTE_PHASES.map((p, index) => {
          const active = p.id === phase;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => (active ? undefined : void changePhase(p.id))}
                disabled={busy !== null}
                aria-current={active ? "step" : undefined}
                className={`flex w-full flex-col items-start rounded-xl border px-3 py-2.5 text-left transition ${
                  active ? "border-[#2e8a5a] bg-[#eaf4ee]" : "border-[#e3e8e2] bg-white hover:border-[#9cc9ad]"
                }`}
              >
                <span className="text-[11px] font-semibold text-[#6a7a70]">{index + 1}</span>
                <span className="text-[13.5px] font-bold text-[#1e3828]">
                  {busy === `phase-${p.id}` ? "切りかえ中…" : p.label}
                </span>
                <span className="mt-0.5 text-[11px] leading-snug text-[#6a7a70]">{p.description}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {phase === "collect" ? (
        <p className="org-game-editor__note">
          届いた案の ☆ を押すと投票の候補になります。候補が2つ以上になったら「投票」に切りかえられます。
        </p>
      ) : null}

      <form onSubmit={addCandidate} className="mb-3 flex gap-2">
        <input
          value={candidate}
          onChange={(e) => setCandidate(e.target.value.slice(0, VOTE_BODY_MAX))}
          placeholder="主催者から候補を足す"
          className="min-w-0 flex-1 rounded-lg border border-[#d8e4dc] px-3 py-2 text-[14px] outline-none focus:border-[#2e8a5a]"
        />
        <button type="submit" disabled={!candidate.trim() || busy !== null} className="ge-btn">
          <Plus className="h-4 w-4" aria-hidden />
          足す
        </button>
      </form>

      <div className="mb-2 flex gap-1.5" role="tablist">
        {(
          [
            ["all", "すべて"],
            ["candidate", "候補"],
            ["hidden", "隠した案"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={filter === id}
            onClick={() => setFilter(id)}
            className={`rounded-full px-3 py-1 text-[12px] font-semibold ${
              filter === id ? "bg-[#2e8a5a] text-white" : "bg-[#f1f4f0] text-[#4a5a50]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? <p className="org-game-editor__empty">まだありません。</p> : null}
      <ul className="space-y-1.5">
        {shown.map((idea) => (
          <li
            key={idea.id}
            className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 ${
              idea.hidden ? "border-[#f0d8d8] bg-[#fdf6f6] opacity-80" : "border-[#e8ece6] bg-white"
            }`}
          >
            <button
              type="button"
              onClick={() => patch(idea, { isCandidate: !idea.isCandidate })}
              disabled={busy !== null || idea.hidden}
              aria-label={idea.isCandidate ? "候補から外す" : "候補にする"}
              className={`mt-0.5 shrink-0 rounded-full p-1 ${idea.isCandidate ? "text-[#c9a227]" : "text-[#b9c4bd]"} disabled:opacity-40`}
            >
              {busy === idea.id ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : idea.isCandidate ? <Star className="h-5 w-5 fill-current" aria-hidden /> : <StarOff className="h-5 w-5" aria-hidden />}
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-[#1e3828]">{idea.body}</p>
              {idea.note ? <p className="mt-0.5 text-[12px] text-[#6a7a70]">{idea.note}</p> : null}
              <p className="mt-0.5 text-[11px] text-[#8a978f]">
                {idea.fromOrganizer ? "主催者が追加" : idea.nickname ?? "参加者"}
                {phase !== "collect" && idea.isCandidate ? `・${idea.votes}票` : ""}
                {idea.reportCount > 0 ? (
                  <span className="ml-1 inline-flex items-center gap-0.5 text-[#b91c1c]">
                    <Flag className="h-3 w-3" aria-hidden />
                    通報{idea.reportCount}
                  </span>
                ) : null}
              </p>
            </div>
            <button
              type="button"
              onClick={() => patch(idea, { hidden: !idea.hidden })}
              disabled={busy !== null}
              aria-label={idea.hidden ? "表示に戻す" : "隠す"}
              className="shrink-0 rounded-full p-1.5 text-[#8a978f] hover:bg-[#f3f3f1]"
            >
              {idea.hidden ? <Eye className="h-4 w-4" aria-hidden /> : <EyeOff className="h-4 w-4" aria-hidden />}
            </button>
          </li>
        ))}
      </ul>

      {phase !== "collect" && state.results.length > 0 ? (
        <div className="mt-4 rounded-xl bg-[#fbf7ea] px-3.5 py-3">
          <p className="flex items-center gap-1.5 text-[13px] font-bold text-[#8a6510]">
            <Trophy className="h-4 w-4" aria-hidden />
            {phase === "result" ? "結果" : "いまの票（参加者には結果発表まで見えません）"}
          </p>
          <ol className="mt-2 space-y-1">
            {state.results.map((row) => (
              <li key={row.ideaId} className="flex items-center gap-2 text-[13px]">
                <span className="w-9 shrink-0 font-bold text-[#6a7a70]">{row.rank}位</span>
                <span className="min-w-0 flex-1 truncate text-[#1e3828]">{row.body}</span>
                <span className="shrink-0 font-semibold text-[#4a5a50]">{row.votes}票</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {error ? <p className="org-game-editor__note">{error}</p> : null}
    </section>
  );
}
