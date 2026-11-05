"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { EventQuestion } from "@/lib/event-questions";

type AnswersResponse = {
  event: { id: string; title: string; date: string };
  questions: EventQuestion[];
  participants: Array<{
    id: string;
    name: string;
    status: string;
    createdAt: string;
    answers: { label: string; value: string }[];
    rawAnswers: Record<string, string>;
  }>;
};

const STATUS_LABEL: Record<string, string> = {
  applied: "申込済み",
  confirmed: "参加確定",
  declined: "キャンセル",
  change_requested: "変更の相談中",
  checked_in: "受付済み",
  completed: "参加済み",
};

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function csvCell(value: string) {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** 申し込んだ人の一覧と、申し込みの質問への答え */
export function EventAnswersClient() {
  const params = useParams();
  const eventId = typeof params.id === "string" ? params.id : "";
  const [data, setData] = useState<AnswersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithTimeout(`/api/organizer/events/${eventId}/answers`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof body.error === "string" ? body.error : "取得に失敗しました");
      setData(body as AnswersResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  /** 選択式の質問ごとに、選ばれた数を数える */
  const tallies = useMemo(() => {
    if (!data) return [];
    const active = data.participants.filter((p) => p.status !== "declined");
    return data.questions
      .filter((q) => q.type === "select")
      .map((q) => ({
        question: q,
        counts: (q.options ?? []).map((option) => ({
          option,
          count: active.filter((p) => p.rawAnswers[q.id] === option).length,
        })),
      }));
  }, [data]);

  const downloadCsv = () => {
    if (!data) return;
    const header = ["名前", "状態", "申込日時", ...data.questions.map((q) => q.label)];
    const rows = data.participants.map((p) => [
      p.name,
      STATUS_LABEL[p.status] ?? p.status,
      formatTime(p.createdAt),
      ...data.questions.map((q) => p.rawAnswers[q.id] ?? ""),
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
    // Excel で文字化けしないよう、先頭に BOM をつける
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `申し込み_${data.event.title.slice(0, 30)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      <Link
        href={eventId ? `/organizer/events/${encodeURIComponent(eventId)}` : "/organizer/events"}
        className="inline-flex items-center gap-1 text-[13px] font-medium text-[#2D7A4F] hover:underline"
      >
        <ArrowLeft size={14} />
        イベントの編集に戻る
      </Link>

      <header className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[20px] font-bold text-[#1A2214]">申し込みと答え</h1>
          {data ? (
            <p className="mt-1 text-[13px] text-[#566358]">
              {data.event.title}
              {data.event.date ? ` · ${data.event.date}` : ""}
            </p>
          ) : null}
        </div>
        {data && data.participants.length > 0 ? (
          <button
            type="button"
            onClick={downloadCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#2D7A4F] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#2D7A4F]"
          >
            <Download size={13} aria-hidden />
            CSV で保存
          </button>
        ) : null}
      </header>

      {loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-[#EAF4ED]" />
          ))}
        </div>
      ) : error || !data ? (
        <div className="mt-6 rounded-xl border border-[#DDE8DF] bg-white p-6 text-center">
          <p className="text-[13px] text-[#566358]">{error ?? "データを表示できません"}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 inline-flex items-center gap-1 rounded-lg border border-[#2D7A4F] px-3 py-1.5 text-[12px] font-medium text-[#2D7A4F]"
          >
            <RefreshCw size={12} />
            再読み込み
          </button>
        </div>
      ) : (
        <>
          {data.questions.length === 0 ? (
            <p className="mt-4 rounded-xl border border-[#DDE8DF] bg-white px-4 py-3 text-[12.5px] leading-relaxed text-[#566358]">
              このイベントには申し込みの質問がありません。イベントの編集の「詳細情報」で、申し込むときに聞く質問を足せます。
            </p>
          ) : null}

          {tallies.length > 0 && data.participants.length > 0 ? (
            <section className="mt-5 grid gap-3 sm:grid-cols-2">
              {tallies.map(({ question, counts }) => (
                <div key={question.id} className="rounded-xl border border-[#DDE8DF] bg-white px-4 py-3">
                  <p className="text-[12.5px] font-semibold text-[#1A2214]">{question.label}</p>
                  <ul className="mt-2 space-y-1">
                    {counts.map(({ option, count }) => (
                      <li key={option} className="flex items-center justify-between text-[12.5px] text-[#3d4a3b]">
                        <span className="min-w-0 truncate">{option}</span>
                        <span className="shrink-0 font-semibold tabular-nums">{count}人</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ) : null}

          <section className="mt-5 overflow-hidden rounded-xl border border-[#DDE8DF] bg-white">
            <div className="flex items-center justify-between border-b border-[#EAF4ED] px-4 py-3">
              <h2 className="text-[14px] font-bold text-[#1A2214]">
                申し込んだ人
                <span className="ml-1.5 text-[12px] font-medium text-[#566358]">{data.participants.length}人</span>
              </h2>
              <button
                type="button"
                onClick={() => void load()}
                className="inline-flex items-center gap-1 text-[11px] text-[#566358]"
              >
                <RefreshCw size={11} />
                更新
              </button>
            </div>
            {data.participants.length === 0 ? (
              <p className="px-4 py-8 text-center text-[13px] text-[#566358]">まだ申し込みがありません</p>
            ) : (
              <ul className="divide-y divide-[#EAF4ED]">
                {data.participants.map((p) => (
                  <li key={p.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="min-w-0 truncate text-[13.5px] font-semibold text-[#1A2214]">{p.name}</p>
                      <div className="shrink-0 text-right">
                        <span
                          className={
                            p.status === "declined"
                              ? "text-[11px] font-medium text-[#E53935]"
                              : "text-[11px] font-medium text-[#2D7A4F]"
                          }
                        >
                          {STATUS_LABEL[p.status] ?? p.status}
                        </span>
                        <p className="text-[11px] text-[#566358]">{formatTime(p.createdAt)}</p>
                      </div>
                    </div>
                    {p.answers.length > 0 ? (
                      <dl className="mt-2 space-y-1.5 rounded-lg bg-[#F5F8F5] px-3 py-2">
                        {p.answers.map((a) => (
                          <div key={a.label}>
                            <dt className="text-[11px] text-[#566358]">{a.label}</dt>
                            <dd className="whitespace-pre-wrap break-words text-[13px] text-[#1A2214]">{a.value}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : data.questions.length > 0 ? (
                      <p className="mt-1 text-[11.5px] text-[#999]">答えはありません</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
