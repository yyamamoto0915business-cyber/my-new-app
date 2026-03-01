"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { Breadcrumb } from "@/components/breadcrumb";
import { ChatRoom } from "@/components/chat/chat-room";

type Recruitment = {
  id: string;
  title: string;
  description: string;
  status: string;
  start_at: string | null;
  end_at: string | null;
  meeting_place: string | null;
  meeting_lat: number | null;
  meeting_lng: number | null;
  roles: { name: string; count: number }[];
  capacity: number | null;
  items_to_bring: string | null;
  provisions: string | null;
  notes: string | null;
  organizers?: { organization_name: string | null };
};

export function RecruitmentDetailClient({
  recruitmentId,
}: {
  recruitmentId: string;
}) {
  const [recruitment, setRecruitment] = useState<Recruitment | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [applying, setApplying] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadRecruitment = useCallback(() => {
    fetchWithTimeout(`/api/recruitments/${recruitmentId}`)
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then(setRecruitment)
      .catch(() => setRecruitment(null));
  }, [recruitmentId]);

  useEffect(() => {
    loadRecruitment();
  }, [loadRecruitment]);

  useEffect(() => {
    fetchWithTimeout("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setCurrentUserId(data?.user?.id ?? ""))
      .catch(() => setCurrentUserId(""));
  }, []);

  useEffect(() => {
    if (!currentUserId || !recruitment) return;
    fetchWithTimeout(`/api/recruitments/${recruitmentId}/my-status`)
      .then((r) => r.json())
      .then((data) => setApplicationStatus(data?.status ?? null))
      .catch(() => setApplicationStatus(null));
  }, [currentUserId, recruitmentId, recruitment]);

  useEffect(() => {
    if (!applicationStatus || applicationStatus === "rejected" || applicationStatus === "canceled")
      return;
    fetchWithTimeout(`/api/recruitments/${recruitmentId}/chat-room`)
      .then((r) => r.json())
      .then((data) => setRoomId(data?.roomId ?? null))
      .catch(() => setRoomId(null));
  }, [applicationStatus, recruitmentId]);

  const handleApply = async () => {
    setApplying(true);
    setError(null);
    try {
      const res = await fetchWithTimeout(`/api/recruitments/${recruitmentId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: applyMessage.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setApplicationStatus("pending");
        setApplyMessage("");
        if (data.roomId) setRoomId(data.roomId);
        loadRecruitment();
      } else {
        setError(data.error ?? "応募に失敗しました");
      }
    } catch {
      setError("応募に失敗しました");
    } finally {
      setApplying(false);
    }
  };

  if (!recruitment) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  if (recruitment.status === "draft") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">この募集は非公開です</p>
      </div>
    );
  }

  const meetingTime = recruitment.start_at
    ? new Date(recruitment.start_at).toLocaleString("ja-JP", {
        month: "long",
        day: "numeric",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "未定";
  const place = recruitment.meeting_place ?? "未定";

  const shortTitle =
    recruitment.title.length > 24 ? `${recruitment.title.slice(0, 24)}…` : recruitment.title;

  const hasApplied =
    applicationStatus &&
    applicationStatus !== "rejected" &&
    applicationStatus !== "canceled";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-zinc-200/60 bg-white/80 shadow-sm backdrop-blur-md dark:border-zinc-700/60 dark:bg-zinc-900/80">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Breadcrumb
            items={[
              { label: "トップ", href: "/" },
              { label: "募集一覧", href: "/recruitments" },
              { label: shortTitle },
            ]}
          />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <article className="rounded-2xl border border-zinc-200/60 bg-white/95 p-6 shadow-lg backdrop-blur-sm dark:border-zinc-700/60 dark:bg-zinc-900/95">
          <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-900/20">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              📍 集合: {place}
            </p>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              🕐 {meetingTime}
            </p>
          </div>

          <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {recruitment.title}
          </h1>

          {recruitment.organizers?.organization_name && (
            <p className="mt-1 text-sm text-zinc-500">
              {recruitment.organizers.organization_name}
            </p>
          )}

          <p className="mt-3 text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">
            {recruitment.description}
          </p>

          <dl className="mt-6 space-y-4">
            {recruitment.roles?.length > 0 && (
              <div>
                <dt className="text-sm font-medium text-zinc-500">役割・人数</dt>
                <dd className="text-zinc-900 dark:text-zinc-100">
                  {recruitment.roles
                    .map((r) => `${r.name} ${r.count}名`)
                    .join(" / ")}
                </dd>
              </div>
            )}
            {recruitment.items_to_bring && (
              <div>
                <dt className="text-sm font-medium text-zinc-500">持ち物・服装</dt>
                <dd className="text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap">
                  {recruitment.items_to_bring}
                </dd>
              </div>
            )}
            {recruitment.provisions && (
              <div>
                <dt className="text-sm font-medium text-zinc-500">支給</dt>
                <dd className="text-zinc-900 dark:text-zinc-100">
                  {recruitment.provisions}
                </dd>
              </div>
            )}
            {recruitment.notes && (
              <div>
                <dt className="text-sm font-medium text-zinc-500">注意事項</dt>
                <dd className="text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap">
                  {recruitment.notes}
                </dd>
              </div>
            )}
          </dl>

          <div className="mt-8 space-y-4">
            {!currentUserId ? (
              <Link
                href={`/login?returnTo=/recruitments/${recruitmentId}`}
                className="inline-block rounded-lg bg-[var(--accent)] px-6 py-3 font-medium text-white hover:opacity-90"
              >
                ログインして応募する
              </Link>
            ) : hasApplied ? (
              <div>
                <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
                  ✓ 応募済み
                  {applicationStatus === "accepted" || applicationStatus === "confirmed"
                    ? "（採用）"
                    : applicationStatus === "pending"
                      ? "（確認中）"
                      : ""}
                </p>
                {roomId && (
                  <div className="mt-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
                    <h3 className="font-semibold">チャット</h3>
                    <div className="mt-2 h-64 overflow-y-auto">
                      <ChatRoom
                        roomId={roomId}
                        currentUserId={currentUserId}
                        otherPartyName={
                          recruitment.organizers?.organization_name ?? "主催者"
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : recruitment.status === "public" ? (
              <div>
                {error && (
                  <p className="mb-2 text-sm text-red-600">{error}</p>
                )}
                <textarea
                  placeholder="一言メッセージ（任意）"
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800"
                />
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={applying}
                  className="mt-2 rounded-lg bg-[var(--accent)] px-6 py-3 font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {applying ? "応募中..." : "1タップで応募"}
                </button>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">この募集は受付終了しています</p>
            )}
          </div>
        </article>
      </main>
    </div>
  );
}
