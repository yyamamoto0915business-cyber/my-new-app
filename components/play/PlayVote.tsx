"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Flag, Loader2, Send, Trash2, Trophy } from "lucide-react";
import { readPlaySession } from "@/lib/organizer/play-session";
import { VOTE_BODY_MAX, VOTE_NOTE_MAX } from "@/lib/organizer/vote";
import type { VoteIdeaView, VotePlayState } from "@/lib/organizer/vote-play";

type Props = { token: string };

type Action =
  | { action: "state" }
  | { action: "idea"; body: string; note: string }
  | { action: "delete" | "vote" | "report"; ideaId: string };

/** 投票ゲームの参加画面。段階（案を集める・投票・結果）は主催者が切りかえるので、開くたびに読み直す */
export function PlayVote({ token }: Props) {
  const [state, setState] = useState<VotePlayState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [note, setNote] = useState("");
  const [reported, setReported] = useState<string[]>([]);

  const call = useCallback(
    async (payload: Action, busyKey: string | null = null): Promise<boolean> => {
      const session = readPlaySession(token);
      if (!session) {
        setError("先に参加用QRから入ってください");
        return false;
      }
      setBusy(busyKey);
      setError(null);
      try {
        const res = await fetch(`/api/play/${encodeURIComponent(token)}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceToken: session.deviceToken, ...payload }),
        });
        const json = (await res.json().catch(() => ({}))) as { state?: VotePlayState; error?: string };
        if (!res.ok || !json.state) {
          setError(json.error ?? "保存できませんでした");
          return false;
        }
        setState(json.state);
        return true;
      } catch {
        setError("通信エラーが発生しました");
        return false;
      } finally {
        setBusy(null);
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void call({ action: "state" });
    // 主催者が段階を切りかえたら分かるよう、画面に戻ってきたときに読み直す
    const onVisible = () => {
      if (document.visibilityState === "visible") void call({ action: "state" });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [call]);

  if (loading && !state) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-[#6a7a70]">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        読み込み中…
      </div>
    );
  }
  if (!state) {
    return <p className="py-8 text-center text-[13px] text-[#b91c1c]">{error ?? "投票を読み込めませんでした"}</p>;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    const ok = await call({ action: "idea", body, note }, "idea");
    if (ok) {
      setBody("");
      setNote("");
      setNotice("案を送りました。ありがとうございます！");
    }
  }

  async function report(idea: VoteIdeaView) {
    if (!window.confirm(`「${idea.body}」を不適切な案として通報しますか？`)) return;
    const ok = await call({ action: "report", ideaId: idea.id }, `report-${idea.id}`);
    if (ok) {
      setReported((prev) => [...prev, idea.id]);
      setNotice("通報を受け付けました。主催者が確認します。");
    }
  }

  const remainingIdeas = Math.max(state.maxIdeasPerPlayer - state.myIdeas.length, 0);
  const votesLeft = Math.max(state.votesPerPlayer - state.myVotes.length, 0);

  return (
    <div className="space-y-4 text-left">
      <section className="rounded-2xl bg-[#f6f8f4] px-4 py-3.5">
        <p className="text-[11.5px] font-semibold text-[#2e8a5a]">
          {state.phase === "collect" ? "案を募集中" : state.phase === "vote" ? "投票受付中" : "結果発表"}
        </p>
        <p className="mt-1 text-[16px] font-bold leading-snug text-[#1e3828]">{state.prompt}</p>
        {state.guide ? <p className="mt-1.5 text-[12.5px] leading-[1.7] text-[#4a5a50]">{state.guide}</p> : null}
      </section>

      {notice ? (
        <p className="rounded-xl bg-[#eaf4ee] px-3 py-2 text-[12.5px] text-[#226b46]" role="status">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl bg-[#fdecec] px-3 py-2 text-[12.5px] text-[#b91c1c]" role="alert">
          {error}
        </p>
      ) : null}

      {state.phase === "collect" ? (
        <>
          {remainingIdeas > 0 ? (
            <form onSubmit={submit} className="space-y-2.5">
              <label className="block">
                <span className="text-[12.5px] font-semibold text-[#1e3828]">あなたの案</span>
                <input
                  value={body}
                  onChange={(e) => setBody(e.target.value.slice(0, VOTE_BODY_MAX))}
                  maxLength={VOTE_BODY_MAX}
                  placeholder="案を入力"
                  className="mt-1 w-full rounded-xl border border-[#d8e4dc] bg-white px-3.5 py-3 text-[15px] outline-none focus:border-[#2e8a5a]"
                />
              </label>
              {state.allowNote ? (
                <label className="block">
                  <span className="text-[12px] text-[#5a6a60]">理由・ひとこと（任意）</span>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value.slice(0, VOTE_NOTE_MAX))}
                    maxLength={VOTE_NOTE_MAX}
                    rows={2}
                    className="mt-1 w-full resize-none rounded-xl border border-[#d8e4dc] bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-[#2e8a5a]"
                  />
                </label>
              ) : null}
              <button
                type="submit"
                disabled={!body.trim() || busy !== null}
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[#2e8a5a] text-[15px] font-semibold text-white shadow-[0_4px_14px_rgba(46,138,90,0.28)] disabled:opacity-50"
              >
                {busy === "idea" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
                案を送る
              </button>
              <p className="text-center text-[11.5px] text-[#7a8a80]">あと {remainingIdeas} つ送れます</p>
            </form>
          ) : (
            <p className="rounded-xl bg-[#f6f8f4] px-3 py-3 text-center text-[13px] text-[#4a5a50]">
              案は送りきりました。投票がはじまるまでお待ちください。
            </p>
          )}

          {state.myIdeas.length > 0 ? (
            <section>
              <h3 className="mb-2 text-[12.5px] font-semibold text-[#1e3828]">送った案</h3>
              <ul className="space-y-2">
                {state.myIdeas.map((idea) => (
                  <li key={idea.id} className="flex items-start gap-2 rounded-xl border border-[#e3e8e2] bg-white px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold text-[#1e3828]">{idea.body}</p>
                      {idea.note ? <p className="mt-0.5 text-[12px] text-[#6a7a70]">{idea.note}</p> : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => void call({ action: "delete", ideaId: idea.id }, `delete-${idea.id}`)}
                      disabled={busy !== null}
                      aria-label={`「${idea.body}」を取り消す`}
                      className="shrink-0 rounded-full p-1.5 text-[#8a978f] hover:bg-[#f3f3f1]"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <p className="text-center text-[11.5px] text-[#8a978f]">いま {state.ideaCount} 件の案が届いています</p>
        </>
      ) : null}

      {state.phase === "vote" ? (
        <section>
          <p className="mb-2 text-[12.5px] text-[#4a5a50]">
            {state.votesPerPlayer === 1
              ? "いいと思う候補を1つ選んでください（あとから選び直せます）"
              : `いいと思う候補を${state.votesPerPlayer}つまで選べます（あと${votesLeft}票）`}
          </p>
          <ul className="space-y-2">
            {state.candidates.map((idea) => {
              const voted = state.myVotes.includes(idea.id);
              return (
                <li key={idea.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void call({ action: "vote", ideaId: idea.id }, `vote-${idea.id}`)}
                    disabled={busy !== null || (!voted && votesLeft === 0 && state.votesPerPlayer > 1)}
                    aria-pressed={voted}
                    className={`flex min-h-[52px] min-w-0 flex-1 items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition disabled:opacity-60 ${
                      voted ? "border-[#2e8a5a] bg-[#eaf4ee]" : "border-[#e3e8e2] bg-white hover:border-[#9cc9ad]"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        voted ? "border-[#2e8a5a] bg-[#2e8a5a] text-white" : "border-[#c7d3cb] bg-white"
                      }`}
                      aria-hidden
                    >
                      {busy === `vote-${idea.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : voted ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold text-[#1e3828]">{idea.body}</span>
                      {idea.note ? <span className="mt-0.5 block text-[12px] text-[#6a7a70]">{idea.note}</span> : null}
                    </span>
                  </button>
                  {!idea.mine && !reported.includes(idea.id) ? (
                    <button
                      type="button"
                      onClick={() => void report(idea)}
                      disabled={busy !== null}
                      aria-label={`「${idea.body}」を通報する`}
                      className="shrink-0 rounded-full p-2 text-[#a3aea7] hover:bg-[#f3f3f1] hover:text-[#b91c1c]"
                    >
                      <Flag className="h-4 w-4" aria-hidden />
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {state.phase === "result" && state.results ? (
        <section>
          {state.results[0] ? (
            <div className="mb-3 rounded-2xl bg-gradient-to-br from-[#fff6dc] to-[#fdf0c4] px-4 py-4 text-center">
              <Trophy className="mx-auto h-7 w-7 text-[#c9a227]" aria-hidden />
              <p className="mt-1 text-[12px] font-semibold text-[#8a6510]">1位</p>
              <p className="mt-0.5 text-[20px] font-bold text-[#3a2c06]">
                {state.results.filter((r) => r.rank === 1).map((r) => r.body).join("・")}
              </p>
            </div>
          ) : null}
          <ol className="space-y-1.5">
            {state.results.map((row) => (
              <li key={row.ideaId} className="flex items-center gap-3 rounded-xl border border-[#e8ece6] bg-white px-3 py-2">
                <span className="w-8 shrink-0 text-center text-[13px] font-bold text-[#6a7a70]">{row.rank}位</span>
                <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[#1e3828]">{row.body}</span>
                <span className="shrink-0 text-[12.5px] text-[#4a5a50]">{row.votes}票</span>
                {state.myVotes.includes(row.ideaId) ? (
                  <span className="shrink-0 rounded-full bg-[#eaf4ee] px-2 py-[1px] text-[10.5px] font-semibold text-[#2e8a5a]">投票した</span>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
