"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { SurveyResultBars } from "@/components/play/PlaySurvey";
import type { SurveyAdminState } from "@/lib/organizer/survey-play";

function csvCell(value: string) {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  } catch {
    return iso;
  }
}

/** アンケートの管理（集計・自由記述の一覧・締め切り・CSV） */
export function OrganizerSurveyDesk({ gameId, gameType }: { gameId: string; gameType: string }) {
  const [state, setState] = useState<SurveyAdminState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const request = useCallback(
    async (method: "GET" | "POST", body?: unknown, busyKey: string | null = null) => {
      setBusy(busyKey);
      setError(null);
      try {
        const res = await fetchWithTimeout(
          `/api/organizer/games/${gameId}/survey`,
          {
            method,
            cache: "no-store",
            headers: body ? { "Content-Type": "application/json" } : undefined,
            body: body ? JSON.stringify(body) : undefined,
          },
          10000,
        );
        const json = (await res.json().catch(() => ({}))) as SurveyAdminState & { error?: string };
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
    if (gameType !== "survey" || !gameId) return;
    void request("GET");
  }, [gameId, gameType, request]);

  if (gameType !== "survey") return null;
  if (!state) {
    return (
      <section className="org-game-editor__panel">
        <h2>アンケートの結果</h2>
        {error ? <p className="org-game-editor__note">{error}</p> : <p className="org-game-editor__empty">読み込み中…</p>}
      </section>
    );
  }

  function downloadCsv() {
    if (!state) return;
    const header = ["ニックネーム", "答えた日時", ...state.questions.map((q) => q.label)];
    const rows = state.rows.map((r) => [
      r.nickname,
      formatTime(r.answeredAt),
      ...state.questions.map((q) => {
        const v = r.answers[q.id];
        return Array.isArray(v) ? v.join(" / ") : (v ?? "");
      }),
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "アンケートの結果.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function togglePhase() {
    if (!state) return;
    const next = state.phase === "open" ? "closed" : "open";
    const message =
      next === "closed" ? "アンケートを締め切りますか？参加者は答えられなくなります。" : "アンケートを再開しますか？";
    if (!window.confirm(message)) return;
    await request("POST", { action: "phase", phase: next }, "phase");
  }

  const texts = state.tally.filter((t) => t.type === "text");

  return (
    <section className="org-game-editor__panel">
      <div className="org-game-editor__panel-head">
        <div>
          <h2>アンケートの結果</h2>
          <p>
            答えた人 {state.responses}人 ・ {state.phase === "open" ? "受付中" : "締め切り"}
          </p>
        </div>
      </div>

      {error ? <p className="mb-3 rounded-xl bg-[#fdecec] px-3 py-2 text-[12.5px] text-[#b91c1c]">{error}</p> : null}

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void togglePhase()}
          disabled={busy !== null}
          className={`inline-flex min-h-[42px] items-center rounded-full px-4 text-[13px] font-bold disabled:opacity-40 ${
            state.phase === "open" ? "bg-[#1e3828] text-white" : "border border-[#1e3828] text-[#1e3828]"
          }`}
        >
          {busy === "phase" ? "切りかえ中…" : state.phase === "open" ? "締め切る" : "再開する"}
        </button>
        <button
          type="button"
          onClick={downloadCsv}
          disabled={state.responses === 0}
          className="inline-flex min-h-[42px] items-center gap-1.5 rounded-full border border-[#e3e8e2] px-4 text-[13px] font-semibold text-[#4a5a50] disabled:opacity-40"
        >
          <Download className="h-4 w-4" aria-hidden />
          CSV で保存
        </button>
        <button
          type="button"
          onClick={() => void request("GET", undefined, "reload")}
          disabled={busy !== null}
          className="inline-flex min-h-[42px] items-center gap-1.5 rounded-full px-3 text-[12.5px] text-[#6a7a70] disabled:opacity-40"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${busy === "reload" ? "animate-spin" : ""}`} aria-hidden />
          更新
        </button>
      </div>

      <label className="mb-4 flex items-center gap-2.5 rounded-xl bg-[#f6f8f4] px-3.5 py-3 text-[13px] text-[#1e3828]">
        <input
          type="checkbox"
          checked={state.shareResults}
          disabled={busy !== null}
          onChange={(e) => void request("POST", { action: "share", shareResults: e.target.checked }, "share")}
          className="h-4 w-4 accent-[#2e8a5a]"
        />
        答えた人に、みんなの結果（選択と5段階だけ）を見せる
      </label>

      {state.responses === 0 ? (
        <p className="text-[12.5px] text-[#6a7a70]">まだ答えがありません。参加用の QR や参加コードを案内してください。</p>
      ) : (
        <>
          <SurveyResultBars tally={state.tally} />
          {texts.map((t) =>
            t.type === "text" ? (
              <div key={t.questionId} className="mt-3 rounded-xl border border-[#e8ece6] bg-white px-3.5 py-3">
                <p className="text-[13px] font-bold text-[#1e3828]">
                  {t.label}
                  <span className="ml-1.5 text-[11.5px] font-normal text-[#6a7a70]">{t.answered}件</span>
                </p>
                {t.texts.length === 0 ? (
                  <p className="mt-1 text-[12px] text-[#8a978f]">まだありません</p>
                ) : (
                  <ul className="mt-2 max-h-[280px] space-y-1.5 overflow-y-auto">
                    {t.texts.map((s, i) => (
                      <li key={i} className="whitespace-pre-wrap rounded-lg bg-[#f6f8f4] px-3 py-2 text-[12.5px] text-[#1e3828]">
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null,
          )}
        </>
      )}
    </section>
  );
}
