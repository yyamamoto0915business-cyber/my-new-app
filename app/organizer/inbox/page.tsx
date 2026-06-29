"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { OrganizerRegistrationGate } from "@/components/organizer/OrganizerRegistrationGate";
import { OrganizerInboxHeroBanner } from "@/components/organizer/OrganizerInboxHeroBanner";
import { OrganizerHeroBleed, OrganizerPageShell } from "@/components/organizer/OrganizerPageShell";

type Thread = {
  id: string;
  eventId: string;
  volunteerRoleId: string;
  organizerId: string;
  volunteerId: string;
  status: "open" | "resolved";
  lastMessageAt: string;
  partnerName: string;
};

type Message = {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
};

type ThreadDetail = {
  thread: Thread;
  messages: Message[];
};

type TabFilter = "all" | "unread" | "volunteer";

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const dStr = d.toISOString().slice(0, 10);
  if (dStr === todayStr) {
    return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (dStr === yesterday.toISOString().slice(0, 10)) return "昨日";
  return d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
}

const EnvelopeIcon = ({ size = 24, stroke = "#aaa" }: { size?: number; stroke?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

export default function OrganizerInboxPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [threadDetail, setThreadDetail] = useState<ThreadDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [tabFilter, setTabFilter] = useState<TabFilter>("all");
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchWithTimeout("/api/dm/threads?as=organizer")
      .then((r) => r.json())
      .then((data: unknown) => {
        const t = Array.isArray(data) ? (data as Thread[]) : [];
        setThreads(t);
        if (t.length > 0) setSelectedThreadId(t[0].id);
      })
      .catch(() => {
        setThreads([]);
        setError("読み込みに失敗しました");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedThreadId) return;
    setDetailLoading(true);
    setThreadDetail(null);
    fetchWithTimeout(`/api/dm/${selectedThreadId}`)
      .then((r) => r.json())
      .then((data: unknown) => {
        if (data && typeof data === "object" && "thread" in data) {
          setThreadDetail(data as ThreadDetail);
        }
      })
      .catch(() => setThreadDetail(null))
      .finally(() => setDetailLoading(false));
  }, [selectedThreadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadDetail?.messages.length]);

  const filteredThreads = useMemo(() => {
    if (tabFilter === "unread") return threads.filter((t) => t.status === "open");
    return threads;
  }, [threads, tabFilter]);

  const stats = useMemo(() => ({
    total: threads.length,
    unread: threads.filter((t) => t.status === "open").length,
    read: threads.filter((t) => t.status === "resolved").length,
  }), [threads]);

  const handleSend = useCallback(async () => {
    if (!replyText.trim() || !selectedThreadId || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/dm/${selectedThreadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyText.trim() }),
      });
      const data = await res.json().catch(() => ({})) as { id?: string };
      if (data.id) {
        setThreadDetail((prev) =>
          prev ? { ...prev, messages: [...prev.messages, data as Message] } : prev
        );
        setReplyText("");
      }
    } finally {
      setSending(false);
    }
  }, [replyText, selectedThreadId, sending]);

  const selectedThread = threads.find((t) => t.id === selectedThreadId) ?? null;

  const tabItems = [
    { key: "all" as const, label: "すべて" },
    { key: "unread" as const, label: "未読" },
    { key: "volunteer" as const, label: "ボランティア" },
  ] as const;

  return (
    <OrganizerRegistrationGate>
      <OrganizerPageShell variant="hero" contentClassName="space-y-2.5 pb-16 min-[900px]:space-y-3 min-[900px]:pb-0">
        <OrganizerHeroBleed>
          <OrganizerInboxHeroBanner />
        </OrganizerHeroBleed>

        {/* 統計 */}
        <section aria-label="メッセージの概要" className="grid w-full grid-cols-3 gap-1.5 min-[900px]:gap-2.5">
          <InboxStatCard
            value={loading ? "—" : stats.total}
            label="全メッセージ"
            valueColor="#2B3A6B"
            bg="#EEF4FB"
            border="#C5DBE8"
          />
          <InboxStatCard
            value={loading ? "—" : stats.unread}
            label="未読"
            valueColor="#C44D68"
            bg="#FDE8ED"
            border="#F0B8C4"
            muted={!loading && stats.unread === 0}
          />
          <InboxStatCard
            value={loading ? "—" : stats.read}
            label="既読"
            valueColor="#7a6a58"
            bg="#EDE8E0"
            border="#d8d0c4"
            muted={!loading && stats.read === 0}
          />
        </section>

        {loading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-[120px] rounded-lg bg-[#e8e6e0] min-[900px]:h-[500px]"/>
          </div>
        ) : error ? (
          <div className="rounded-lg border-[0.5px] border-[#e8e6e0] bg-white px-4 py-6 text-center">
            <p className="text-[13px] text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 text-[13px] text-[#2B3A6B] underline"
            >
              再読み込み
            </button>
          </div>
        ) : (
            <>
              {/* ── PC: 2列レイアウト ── */}
              <div className="hidden min-[900px]:grid min-[900px]:grid-cols-[280px_1fr] min-[900px]:gap-4 min-[900px]:min-h-[480px]">

                {/* 左: スレッドリスト */}
                <div className="flex flex-col overflow-hidden rounded-[14px] border-[0.5px] border-[#e8e6e0] bg-white">
                  {/* ヘッダー */}
                  <div className="flex items-center justify-between border-b border-[#e8e6e0] px-4 py-3.5">
                    <span className="text-[13px] font-[500] text-[#1a1a1a]">メッセージ</span>
                    {stats.unread > 0 && (
                      <span className="rounded-full bg-[#E8708A] px-2 py-0.5 text-[10px] font-[700] text-white">
                        未読 {stats.unread}
                      </span>
                    )}
                  </div>

                  {/* タブ */}
                  <div className="flex border-b border-[#e8e6e0]" style={{ marginBottom: "-0.5px" }}>
                    {tabItems.map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setTabFilter(key)}
                        className="flex-1 py-2.5 text-center text-[12px] transition-colors"
                        style={{
                          borderBottom: `2px solid ${tabFilter === key ? "#2B3A6B" : "transparent"}`,
                          color: tabFilter === key ? "#2B3A6B" : "#888",
                          fontWeight: tabFilter === key ? 500 : 400,
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* スレッドアイテム */}
                  <div className="flex-1 overflow-y-auto">
                    {filteredThreads.length === 0 ? (
                      <InboxEmptyState compact />
                    ) : (
                      filteredThreads.map((t) => {
                        const isSelected = t.id === selectedThreadId;
                        const isUnread = t.status === "open";
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setSelectedThreadId(t.id)}
                            className="flex w-full items-start gap-2.5 border-b border-[#f5f3ef] px-4 py-3 text-left transition-colors hover:bg-[#fafaf8]"
                            style={{ background: isSelected ? "#EEF2FF" : undefined }}
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEF4FB] text-[13px] font-[500] text-[#2B3A6B]">
                              {t.partnerName.slice(0, 1)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`truncate text-[13px] text-[#1a1a1a] ${isUnread ? "font-[600]" : ""}`}>
                                {t.partnerName}
                              </p>
                              <p className="mt-0.5 truncate text-[11px] text-[#888]">
                                {t.status === "resolved" ? "完了" : "対応中"}
                              </p>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1">
                              <span className="text-[10px] text-[#888]">{formatTime(t.lastMessageAt)}</span>
                              {isUnread && (
                                <span className="h-[7px] w-[7px] rounded-full bg-[#E8708A]"/>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 右: メッセージ詳細 */}
                <div className="flex flex-col overflow-hidden rounded-[14px] border-[0.5px] border-[#e8e6e0] bg-white">
                  {selectedThread === null ? (
                    <InboxEmptyState />
                  ) : (
                    <>
                      {/* メッセージヘッダー */}
                      <div className="flex items-center gap-3 border-b border-[#e8e6e0] px-5 py-3.5">
                        <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[#EEF4FB] text-[14px] font-[500] text-[#2B3A6B]">
                          {selectedThread.partnerName.slice(0, 1)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-[500] text-[#1a1a1a]">{selectedThread.partnerName}</p>
                          <p className="mt-0.5 text-[11px] text-[#888]">ボランティア DM</p>
                        </div>
                        <span className="shrink-0 rounded-[10px] bg-[#EEF4FB] px-2.5 py-1 text-[10px] text-[#2B3A6B]">
                          ボランティア申請者
                        </span>
                      </div>

                      {/* メッセージ一覧 */}
                      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
                        {detailLoading ? (
                          <div className="flex flex-1 items-center justify-center">
                            <p className="text-[13px] text-[#888]">読み込み中…</p>
                          </div>
                        ) : threadDetail?.messages.map((msg) => {
                          const isMine = msg.senderId === threadDetail.thread.organizerId;
                          return (
                            <div key={msg.id} className={`flex items-end gap-2.5 ${isMine ? "flex-row-reverse" : ""}`}>
                              {!isMine && (
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EEF4FB] text-[11px] font-[500] text-[#2B3A6B]">
                                  {selectedThread.partnerName.slice(0, 1)}
                                </div>
                              )}
                              {isMine && (
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2B3A6B] text-[11px] font-[500] text-white">
                                  私
                                </div>
                              )}
                              <div className="flex flex-col">
                                <div
                                  className="max-w-[65%] px-3.5 py-2.5 text-[13px] leading-relaxed"
                                  style={{
                                    background: isMine ? "#2B3A6B" : "#F3F2EF",
                                    color: isMine ? "#fff" : "#1a1a1a",
                                    borderRadius: isMine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                                  }}
                                >
                                  {msg.body}
                                </div>
                                <p className={`mt-1 text-[10px] text-[#888] ${isMine ? "text-right" : "text-left"}`}>
                                  {formatTime(msg.createdAt)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef}/>
                      </div>

                      {/* 返信入力 */}
                      <div className="flex items-end gap-2.5 border-t border-[#e8e6e0] px-4 py-3">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="返信を入力..."
                          rows={1}
                          className="flex-1 resize-none rounded-[10px] border-[0.5px] border-[#e8e6e0] bg-[#fafaf8] px-3.5 py-2.5 text-[13px] leading-relaxed outline-none focus:border-[#2B3A6B] focus:bg-white"
                          style={{ minHeight: "40px" }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              void handleSend();
                            }
                          }}
                        />
                        <button
                          type="button"
                          disabled={!replyText.trim() || sending}
                          onClick={() => void handleSend()}
                          className="shrink-0 rounded-[10px] bg-[#2B3A6B] px-4 py-2.5 text-[13px] font-[500] text-white hover:opacity-90 disabled:opacity-50"
                        >
                          送信
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* ── モバイル: タブ＋リスト（1カードに統合） ── */}
              <div className="overflow-hidden rounded-lg border-[0.5px] border-[#e8e6e0] bg-white min-[900px]:hidden">
                <div className="flex border-b border-[#e8e6e0]">
                  {tabItems.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTabFilter(key)}
                      className="flex-1 py-2 text-center text-[11px] transition-colors"
                      style={{
                        color: tabFilter === key ? "#2B3A6B" : "#999",
                        fontWeight: tabFilter === key ? 500 : 400,
                        borderBottom: `2px solid ${tabFilter === key ? "#2B3A6B" : "transparent"}`,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {filteredThreads.length === 0 ? (
                  <InboxEmptyState compact />
                ) : (
                  <ul>
                    {filteredThreads.map((t) => (
                      <li key={t.id} className="border-b border-[#f5f3ef] last:border-b-0">
                        <Link
                          href={`/dm/${t.id}`}
                          className="flex items-center gap-2.5 px-3 py-2.5 transition-colors active:bg-[#fafaf8]"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEF4FB] text-[12px] font-[500] text-[#2B3A6B]">
                            {t.partnerName.slice(0, 1)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`truncate text-[13px] text-[#1a1a1a] ${t.status === "open" ? "font-[600]" : ""}`}>
                              {t.partnerName}
                            </p>
                            <p className="mt-px truncate text-[10px] text-[#999]">
                              {t.status === "resolved" ? "対応済み" : "対応中"}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-0.5">
                            <span className="text-[10px] text-[#999]">{formatTime(t.lastMessageAt)}</span>
                            {t.status === "open" && (
                              <div className="h-[6px] w-[6px] rounded-full bg-[#E8708A]"/>
                            )}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
      </OrganizerPageShell>
    </OrganizerRegistrationGate>
  );
}

function InboxStatCard({
  value,
  label,
  valueColor,
  bg,
  border,
  muted,
}: {
  value: number | string;
  label: string;
  valueColor: string;
  bg: string;
  border: string;
  muted?: boolean;
}) {
  return (
    <div
      className="flex min-h-[58px] flex-col items-center justify-center rounded-lg border-[0.5px] px-1.5 py-2 text-center min-[900px]:min-h-[68px] min-[900px]:px-3 min-[900px]:py-2.5"
      style={{ background: bg, borderColor: border }}
    >
      <p
        className="text-[18px] font-bold tabular-nums leading-none min-[900px]:text-[22px] min-[900px]:font-semibold"
        style={{ color: muted ? "#ccc" : valueColor }}
      >
        {value}
      </p>
      <p
        className="mt-1 text-[10px] font-medium min-[900px]:text-[11px] min-[900px]:font-normal"
        style={{ color: muted ? "#aaa" : valueColor }}
      >
        {label}
      </p>
    </div>
  );
}

function InboxEmptyState({ compact }: { compact?: boolean }) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "gap-1.5 px-4 py-7" : "gap-2.5 p-8"
      }`}
    >
      <div
        className={`flex items-center justify-center rounded-full bg-[#F3F2EF] ${
          compact ? "h-10 w-10" : "h-12 w-12"
        }`}
      >
        <EnvelopeIcon size={compact ? 20 : 24} stroke="#bbb" />
      </div>
      <p className={`font-[500] text-[#1a1a1a] ${compact ? "text-[13px]" : "text-[15px]"}`}>
        ボランティアからの相談はまだありません
      </p>
      {!compact && (
        <p className="max-w-[240px] text-[12px] leading-relaxed text-[#888]">
          ボランティアから相談が届くとここに表示されます
        </p>
      )}
    </div>
  );
}
