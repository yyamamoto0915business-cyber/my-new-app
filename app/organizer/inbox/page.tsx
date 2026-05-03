"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import { WaHeroBanner } from "@/components/wa-hero-banner";

type Thread = {
  id: string;
  eventId: string;
  volunteerRoleId: string;
  status: string;
  lastMessageAt: string;
  partnerName: string;
};

export default function OrganizerInboxPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchWithTimeout("/api/dm/threads?as=organizer")
      .then((r) => r.json())
      .then((data) => setThreads(Array.isArray(data) ? data : []))
      .catch(() => {
        setThreads([]);
        setError("読み込みに失敗しました");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <OrganizerRegistrationGate>
      <div className="min-h-screen bg-[#f4f0e8]">
        <div className="space-y-4">
          <WaHeroBanner
            compact
            eyebrow="INBOX · MESSAGES"
            title="受信箱"
            subtitle="— メッセージ管理 —"
            className="rounded-sm"
          />

          {/* ナビ帯 */}
          <div className="flex items-center border-b border-[#ccc4b4] bg-[#faf8f2] px-4 py-3 rounded-2xl">
            <Link href="/organizer" className="text-[12px] text-[#6a6258] hover:underline">
              ← ダッシュボードへ
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-2xl border border-[#ccc4b4] bg-[#e4ede0]" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-[#ccc4b4] bg-[#faf8f2] p-6 text-center">
              <p className="text-[13px] text-red-600">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-3 text-[13px] text-[#2c7a88] underline"
              >
                再読み込み
              </button>
            </div>
          ) : threads.length === 0 ? (
            <div className="rounded-2xl border border-[#ccc4b4] bg-[#faf8f2] p-8 text-center">
              <p className="text-[13px] text-[#6a6258]">ボランティアからの相談はまだありません</p>
            </div>
          ) : (
            <ul className="overflow-hidden rounded-2xl border border-[#ccc4b4]">
              {threads.map((t, i) => (
                <li key={t.id} className={i > 0 ? "border-t border-[#e8e0d4]" : ""}>
                  <Link
                    href={`/dm/${t.id}`}
                    className="flex items-center justify-between gap-3 bg-[#faf8f2] px-4 py-3.5 transition-colors hover:bg-[#f0ece4]"
                  >
                    {/* アバター */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d8eae4] text-[13px] font-bold text-[#1a3428]">
                      {t.partnerName.slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-[14px] font-bold text-[#0e1610] line-clamp-1"
                        style={{ fontFamily: "'Shippori Mincho', serif" }}
                      >
                        {t.partnerName}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#6a6258]">
                        {new Date(t.lastMessageAt).toLocaleString("ja-JP")}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                        t.status === "resolved"
                          ? "border border-[#d8d0b8] bg-[#f0ede4] text-[#5a5040]"
                          : "border border-[#d8c090] bg-[#f0e8d4] text-[#5a3a10]"
                      }`}
                    >
                      {t.status === "resolved" ? "完了" : "対応中"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </OrganizerRegistrationGate>
  );
}
