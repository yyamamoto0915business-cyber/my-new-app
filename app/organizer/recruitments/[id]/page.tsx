"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { RecruitmentForm } from "@/components/recruitment-form";
import { Breadcrumb } from "@/components/breadcrumb";
import { ChatRoom } from "@/components/chat/chat-room";

type Recruitment = {
  id: string;
  title: string;
  status: string;
  meeting_place: string | null;
  start_at: string | null;
  roles: { name: string; count: number }[];
};

type Application = {
  id: string;
  user_id: string;
  status: string;
  message: string | null;
  role_assigned: string | null;
  checked_in_at: string | null;
  user?: { display_name: string | null; email: string | null };
};

const STATUS_LABELS: Record<string, string> = {
  pending: "未確認",
  accepted: "採用",
  rejected: "不採用",
  canceled: "キャンセル",
  confirmed: "採用",
};

export default function OrganizerRecruitmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [recruitment, setRecruitment] = useState<Recruitment | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [chatParticipantId, setChatParticipantId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkTemplate, setBulkTemplate] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const router = useRouter();
  const [resolvedId, setResolvedId] = useState<string | null>(null);

  useEffect(() => {
    fetchWithTimeout("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setCurrentUserId(data?.user?.id ?? "dev-user"))
      .catch(() => setCurrentUserId("dev-user"));
  }, []);

  useEffect(() => {
    params.then((p) => setResolvedId(p.id));
  }, [params]);

  const load = useCallback(async () => {
    if (!resolvedId) return;
    setLoading(true);
    try {
      const [rRes, aRes] = await Promise.all([
        fetchWithTimeout(`/api/recruitments/${resolvedId}`),
        fetchWithTimeout(`/api/recruitments/${resolvedId}/applications`),
      ]);
      if (rRes.ok) setRecruitment(await rRes.json());
      if (aRes.ok) {
        const appData = await aRes.json();
        setApplications(Array.isArray(appData) ? appData : []);
      }
    } catch {
      setRecruitment(null);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [resolvedId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!resolvedId || !chatParticipantId) {
      setRoomId(null);
      return;
    }
    fetchWithTimeout(
      `/api/recruitments/${resolvedId}/chat-room?participantId=${chatParticipantId}`
    )
      .then((r) => r.json())
      .then((data) => setRoomId(data.roomId ?? null))
      .catch(() => setRoomId(null));
  }, [resolvedId, chatParticipantId]);

  const handleAccept = async (appId: string) => {
    const res = await fetchWithTimeout(
      `/api/recruitments/${resolvedId}/applications/${appId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      }
    );
    if (res.ok) load();
  };

  const handleReject = async (appId: string) => {
    const res = await fetchWithTimeout(
      `/api/recruitments/${resolvedId}/applications/${appId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      }
    );
    if (res.ok) load();
  };

  const handleBulkMessage = async () => {
    if (!resolvedId) return;
    setBulkSending(true);
    try {
      const res = await fetchWithTimeout(
        `/api/recruitments/${resolvedId}/bulk-message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            template: bulkTemplate || undefined,
            content: bulkTemplate ? undefined : "お知らせがあります。",
          }),
        }
      );
      const data = await res.json();
      if (res.ok && data.sent != null) {
        alert(`${data.sent}件送信しました`);
      } else {
        alert(data.error ?? "送信に失敗しました");
      }
    } finally {
      setBulkSending(false);
    }
  };

  if (!resolvedId || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  if (!recruitment) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">募集が見つかりません</p>
        <Link href="/organizer/recruitments" className="ml-2 text-[var(--accent)] underline">
          一覧へ
        </Link>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/95 backdrop-blur-sm dark:bg-[var(--background)]">
          <div className="mx-auto max-w-4xl px-4 py-4">
            <Breadcrumb
              items={[
                { label: "トップ", href: "/" },
                { label: "募集管理", href: "/organizer/recruitments" },
                { label: recruitment.title, href: `/organizer/recruitments/${resolvedId}` },
                { label: "編集" },
              ]}
            />
            <h1 className="mt-2 text-xl font-bold">募集を編集</h1>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-6">
          <div className="rounded-xl border border-[var(--border)] bg-white p-6 dark:bg-[var(--background)]">
            <RecruitmentForm
              recruitmentId={resolvedId}
              initialValues={{
                title: recruitment.title,
                description: (recruitment as { description?: string }).description ?? "",
                status: (recruitment.status === "closed" ? "public" : recruitment.status) as "draft" | "public",
                start_at: (recruitment as { start_at?: string }).start_at ?? "",
                end_at: (recruitment as { end_at?: string }).end_at ?? "",
                meeting_place: recruitment.meeting_place ?? "",
                meeting_lat: (recruitment as { meeting_lat?: number }).meeting_lat ?? null,
                meeting_lng: (recruitment as { meeting_lng?: number }).meeting_lng ?? null,
                roles: recruitment.roles ?? [],
                capacity: (recruitment as { capacity?: number }).capacity ?? null,
                items_to_bring: (recruitment as { items_to_bring?: string }).items_to_bring ?? "",
                provisions: (recruitment as { provisions?: string }).provisions ?? "",
                notes: (recruitment as { notes?: string }).notes ?? "",
              }}
              onSuccess={() => {
                setEditing(false);
                load();
              }}
              onCancel={() => setEditing(false)}
            />
          </div>
        </main>
      </div>
    );
  }

  const acceptedCount = applications.filter(
    (a) => a.status === "accepted" || a.status === "confirmed"
  ).length;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/95 backdrop-blur-sm dark:bg-[var(--background)]">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Breadcrumb
            items={[
              { label: "トップ", href: "/" },
              { label: "募集管理", href: "/organizer/recruitments" },
              { label: recruitment.title },
            ]}
          />
          <div className="mt-2 flex items-center justify-between">
            <h1 className="text-xl font-bold">{recruitment.title}</h1>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-600"
              >
                編集
              </button>
              <Link
                href={`/organizer/recruitments/${resolvedId}/day-of`}
                className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
              >
                当日モード
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 space-y-8">
        <section className="rounded-xl border border-[var(--border)] bg-white p-6 dark:bg-[var(--background)]">
          <h2 className="font-semibold">採用者への一斉連絡</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <select
              value={bulkTemplate}
              onChange={(e) => setBulkTemplate(e.target.value)}
              className="rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800"
            >
              <option value="">カスタム</option>
              <option value="reminder">前日リマインド</option>
              <option value="venue_change">集合場所変更</option>
              <option value="thanks">お礼メッセージ</option>
            </select>
            <button
              type="button"
              onClick={handleBulkMessage}
              disabled={bulkSending || acceptedCount === 0}
              className="rounded bg-[var(--accent)] px-3 py-1.5 text-sm text-white disabled:opacity-50"
            >
              {bulkSending ? "送信中..." : `一斉送信（採用${acceptedCount}名）`}
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-[var(--border)] bg-white p-6 dark:bg-[var(--background)]">
          <h2 className="font-semibold">応募者一覧</h2>
          {applications.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">応募はまだありません</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {applications.map((app) => (
                <li
                  key={app.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-700"
                >
                  <div>
                    <p className="font-medium">
                      {(app.user as { display_name?: string })?.display_name ??
                        app.user_id.slice(0, 8)}
                    </p>
                    {app.message && (
                      <p className="mt-0.5 text-xs text-zinc-500">{app.message}</p>
                    )}
                    <span
                      className={`mt-1 inline-block rounded px-2 py-0.5 text-xs ${
                        app.status === "accepted" || app.status === "confirmed"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30"
                          : app.status === "rejected"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700"
                      }`}
                    >
                      {STATUS_LABELS[app.status] ?? app.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {app.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleAccept(app.id)}
                          className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700"
                        >
                          採用
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(app.id)}
                          className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                        >
                          不採用
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setChatParticipantId(app.user_id);
                      }}
                      className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600"
                    >
                      チャット
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {chatParticipantId && roomId && (
          <section className="fixed inset-4 top-16 z-50 rounded-xl border border-[var(--border)] bg-white shadow-xl dark:bg-[var(--background)] md:inset-8 md:top-24">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b p-3">
                <h3 className="font-semibold">
                  チャット（
                  {applications.find((a) => a.user_id === chatParticipantId)?.user
                    ?.display_name ?? "応募者"}
                  ）
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setChatParticipantId(null);
                    setRoomId(null);
                  }}
                  className="text-zinc-500 hover:text-zinc-700"
                >
                  閉じる
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatRoom
                  roomId={roomId}
                  currentUserId={currentUserId || "dev-user"}
                  otherPartyName={
                    applications.find((a) => a.user_id === chatParticipantId)?.user
                      ?.display_name ?? "応募者"
                  }
                  participantId={chatParticipantId}
                />
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
