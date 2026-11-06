"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, Send } from "lucide-react";
import { readPlaySession } from "@/lib/organizer/play-session";
import { SURVEY_SCALE_LABELS, SURVEY_TEXT_MAX, type SurveyAnswers, type SurveyTally } from "@/lib/organizer/survey";
import type { SurveyPlayState } from "@/lib/organizer/survey-play";

type Props = { token: string };

/** みんなの結果（選択と5段階）。答えた人に、主催者が見せる設定のときだけ出す */
export function SurveyResultBars({ tally }: { tally: SurveyTally[] }) {
  return (
    <div className="space-y-3">
      {tally.map((t) => {
        if (t.type === "text") return null;
        const rows =
          t.type === "scale"
            ? t.counts.map((count, i) => ({ label: `${i + 1} ${SURVEY_SCALE_LABELS[i]}`, count }))
            : t.counts.map((c) => ({ label: c.option, count: c.count }));
        const max = Math.max(1, ...rows.map((r) => r.count));
        return (
          <div key={t.questionId} className="rounded-xl border border-[#e8ece6] bg-white px-3.5 py-3">
            <p className="text-[13px] font-bold text-[#1e3828]">{t.label}</p>
            {t.type === "scale" && t.average !== null ? (
              <p className="mt-0.5 text-[12px] text-[#4a5a50]">平均 {t.average.toFixed(1)}</p>
            ) : null}
            <ul className="mt-2 space-y-1.5">
              {rows.map((r) => (
                <li key={r.label} className="text-[12px]">
                  <div className="flex justify-between gap-2 text-[#3a4a40]">
                    <span className="min-w-0 truncate">{r.label}</span>
                    <span className="shrink-0 tabular-nums">{r.count}</span>
                  </div>
                  <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-[#eef2ee]">
                    <div className="h-full rounded-full bg-[#3a7bd5]" style={{ width: `${(r.count / max) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

/** アンケートの参加画面。1人1回、受付中なら答えを直せる */
export function PlaySurvey({ token }: Props) {
  const [state, setState] = useState<SurveyPlayState | null>(null);
  const [answers, setAnswers] = useState<SurveyAnswers>({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(
    async (payload: { action: "state" } | { action: "answer"; answers: SurveyAnswers }): Promise<boolean> => {
      const session = readPlaySession(token);
      if (!session) {
        setError("先に参加用QRから入ってください");
        setLoading(false);
        return false;
      }
      setError(null);
      try {
        const res = await fetch(`/api/play/${encodeURIComponent(token)}/survey`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceToken: session.deviceToken, ...payload }),
        });
        const json = (await res.json().catch(() => ({}))) as { state?: SurveyPlayState; error?: string };
        if (!res.ok || !json.state) {
          setError(json.error ?? "保存できませんでした");
          return false;
        }
        setState(json.state);
        if (json.state.mine) setAnswers(json.state.mine);
        return true;
      } catch {
        setError("通信エラーが発生しました");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void call({ action: "state" });
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
    return <p className="py-8 text-center text-[13px] text-[#b91c1c]">{error ?? "アンケートを読み込めませんでした"}</p>;
  }

  const answered = state.mine !== null;
  const showForm = state.phase === "open" && (!answered || editing);
  const missing = state.questions.some((q) => {
    if (!q.required) return false;
    const v = answers[q.id];
    return v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (missing || sending) return;
    setSending(true);
    const ok = await call({ action: "answer", answers });
    setSending(false);
    if (ok) {
      setEditing(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  if (!showForm) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-[#eef4fb] px-4 py-5 text-center">
          {answered ? (
            <>
              <Check className="mx-auto h-8 w-8 text-[#3a7bd5]" aria-hidden />
              <p className="mt-1 text-[15px] font-bold text-[#1e3828]">答えを送りました</p>
              {state.thanks ? <p className="mt-1 whitespace-pre-wrap text-[13px] text-[#3a4a40]">{state.thanks}</p> : null}
            </>
          ) : (
            <p className="text-[14px] font-bold text-[#1e3828]">このアンケートは締め切られました</p>
          )}
        </div>
        {answered && state.phase === "open" ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mx-auto block text-[13px] font-semibold text-[#3a7bd5]"
          >
            答えを直す
          </button>
        ) : null}
        {state.results ? (
          <div>
            <p className="mb-1.5 text-[12px] font-semibold text-[#4a5a50]">みんなの結果（{state.responses}人）</p>
            <SurveyResultBars tally={state.results} />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-4">
      {state.questions.map((q, index) => {
        const value = answers[q.id];
        return (
          <fieldset key={q.id} className="rounded-2xl border border-[#e8ece6] bg-white px-4 py-3.5">
            <legend className="sr-only">{q.label}</legend>
            <p className="text-[14px] font-bold leading-snug text-[#1e3828]">
              <span className="mr-1 text-[12px] text-[#3a7bd5]">Q{index + 1}</span>
              {q.label}
              {q.required ? (
                <span className="ml-1.5 rounded bg-[#fdf3e6] px-1.5 py-[1px] text-[10px] font-semibold text-[#c47a2a]">必須</span>
              ) : null}
            </p>
            {q.type === "choice" || q.type === "multi" ? (
              <div className="mt-2 space-y-1.5">
                {q.type === "multi" ? <p className="text-[11px] text-[#7a8a80]">いくつでも選べます</p> : null}
                {q.options?.map((option) => {
                  const on = q.type === "multi" ? Array.isArray(value) && value.includes(option) : value === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        setAnswers((prev) => {
                          if (q.type === "choice") return { ...prev, [q.id]: on ? "" : option };
                          const cur = Array.isArray(prev[q.id]) ? (prev[q.id] as string[]) : [];
                          return { ...prev, [q.id]: on ? cur.filter((x) => x !== option) : [...cur, option] };
                        })
                      }
                      className={`flex min-h-[46px] w-full items-center gap-3 rounded-xl border px-3.5 text-left text-[14px] font-semibold transition ${
                        on ? "border-[#3a7bd5] bg-[#eef4fb]" : "border-[#e3e8e2] bg-white"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center border ${
                          q.type === "multi" ? "rounded-md" : "rounded-full"
                        } ${on ? "border-[#3a7bd5] bg-[#3a7bd5] text-white" : "border-[#c7d3cb]"}`}
                      >
                        {on ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                      </span>
                      {option}
                    </button>
                  );
                })}
              </div>
            ) : q.type === "scale" ? (
              <div className="mt-2">
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const on = value === String(n);
                    return (
                      <button
                        key={n}
                        type="button"
                        aria-pressed={on}
                        aria-label={`${n} ${SURVEY_SCALE_LABELS[n - 1]}`}
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: on ? "" : String(n) }))}
                        className={`flex min-h-[48px] items-center justify-center rounded-xl border text-[16px] font-bold transition ${
                          on ? "border-[#3a7bd5] bg-[#3a7bd5] text-white" : "border-[#e3e8e2] bg-white text-[#1e3828]"
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-1 flex justify-between text-[10.5px] text-[#7a8a80]">
                  <span>{SURVEY_SCALE_LABELS[0]}</span>
                  <span>{SURVEY_SCALE_LABELS[4]}</span>
                </div>
              </div>
            ) : (
              <textarea
                value={typeof value === "string" ? value : ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value.slice(0, SURVEY_TEXT_MAX) }))}
                rows={3}
                placeholder="自由に書いてください"
                className="mt-2 w-full resize-none rounded-xl border border-[#d8e4dc] bg-white px-3 py-2.5 text-[15px] text-[#1e3828] outline-none focus:border-[#3a7bd5]"
              />
            )}
          </fieldset>
        );
      })}
      {error ? <p className="rounded-xl bg-[#fdecec] px-3 py-2 text-[12.5px] text-[#b91c1c]">{error}</p> : null}
      <button
        type="submit"
        disabled={missing || sending}
        className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-full bg-[#3a7bd5] text-[15px] font-bold text-white disabled:opacity-50"
      >
        <Send className="h-4 w-4" aria-hidden />
        {sending ? "送っています…" : answered ? "直した答えを送る" : "答えを送る"}
      </button>
      {missing ? <p className="text-center text-[11.5px] text-[#7a8a80]">必須の質問に答えると送れます</p> : null}
      {editing ? (
        <button type="button" onClick={() => setEditing(false)} className="mx-auto block text-[12.5px] text-[#7a8a80]">
          直すのをやめる
        </button>
      ) : null}
    </form>
  );
}
