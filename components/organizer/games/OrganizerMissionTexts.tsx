"use client";

import { useEffect, useState } from "react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

type Text = { playerId: string; nickname: string; missionIndex: number; missionName: string; text: string; at: string };
type Desk = { enabled: boolean; ready: boolean; texts: Text[] };

function csvCell(value: string) {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function formatTime(iso: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

/** ミッションの「文字で送る」で、参加者から届いた文字の一覧（CSV で保存もできる）。 */
export function OrganizerMissionTexts({ gameId, gameType }: { gameId: string; gameType: string }) {
  const [desk, setDesk] = useState<Desk | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<number | "all">("all");

  useEffect(() => {
    if (gameType !== "mission" || !gameId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchWithTimeout(`/api/organizer/games/${gameId}/mission-texts`, { cache: "no-store" }, 8000);
        const json = (await res.json().catch(() => ({}))) as Desk & { error?: string };
        if (!res.ok) throw new Error(json.error || "届いた文字を読み込めませんでした");
        if (!cancelled) {
          setDesk({ enabled: json.enabled === true, ready: json.ready !== false, texts: Array.isArray(json.texts) ? json.texts : [] });
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "届いた文字を読み込めませんでした");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gameId, gameType]);

  if (gameType !== "mission") return null;
  if (!desk && !error) return null;
  if (desk && !desk.enabled) return null;

  const texts = desk?.texts ?? [];
  const missions = [...new Map(texts.map((t) => [t.missionIndex, t.missionName])).entries()].sort((a, b) => a[0] - b[0]);
  const shown = filter === "all" ? texts : texts.filter((t) => t.missionIndex === filter);

  function downloadCsv() {
    const header = ["ニックネーム", "ミッション", "送った文字", "送った日時"];
    const rows = shown.map((t) => [
      t.nickname,
      t.missionName,
      t.text,
      t.at ? new Date(t.at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }) : "",
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "届いた文字.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="org-game-editor__panel">
      <div className="org-game-editor__panel-head">
        <div>
          <h2>届いた文字</h2>
          {desk?.ready ? <p>{texts.length}件</p> : null}
        </div>
      </div>
      {desk && !desk.ready ? (
        <p className="org-game-editor__empty">文字を残す準備ができていません（データベースの更新が必要です）。</p>
      ) : null}
      {desk?.ready && texts.length === 0 ? <p className="org-game-editor__empty">まだ届いていません。</p> : null}
      {texts.length > 0 ? (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {missions.length > 1 ? (
              <select
                value={filter === "all" ? "all" : String(filter)}
                onChange={(e) => setFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                aria-label="ミッションでしぼる"
                className="min-h-[42px] max-w-full rounded-full border border-[#d5dcd5] bg-white px-3 text-[13px]"
              >
                <option value="all">すべてのミッション</option>
                {missions.map(([index, name]) => (
                  <option key={index} value={index}>
                    {name}
                  </option>
                ))}
              </select>
            ) : null}
            <button
              type="button"
              onClick={downloadCsv}
              className="inline-flex min-h-[42px] items-center rounded-full border border-[#1e3828] px-4 text-[13px] font-bold text-[#1e3828]"
            >
              CSV で保存
            </button>
          </div>
          <ul className="m-0 grid list-none gap-2 p-0">
            {shown.map((t) => (
              <li key={`${t.playerId}-${t.missionIndex}`} className="rounded-[14px] border border-[#e3e8e3] bg-white px-3.5 py-2.5">
                <p className="m-0 whitespace-pre-wrap break-words text-[14px] leading-relaxed text-[#163828]">{t.text}</p>
                <p className="m-0 mt-1 text-[11.5px] text-[#6a7568]">
                  {t.nickname}・{t.missionName}
                  {t.at ? `・${formatTime(t.at)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {error ? <p className="org-game-editor__note">{error}</p> : null}
    </section>
  );
}
