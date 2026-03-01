"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { Breadcrumb } from "@/components/breadcrumb";

type Application = {
  id: string;
  user_id: string;
  status: string;
  role_assigned: string | null;
  checked_in_at: string | null;
  user?: { display_name: string | null; email: string | null };
};

type Recruitment = {
  id: string;
  title: string;
  meeting_place: string | null;
  start_at: string | null;
  roles: { name: string; count: number }[];
};

export default function DayOfModePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [recruitment, setRecruitment] = useState<Recruitment | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "arrived" | "not_arrived">("all");
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const [bulkSending, setBulkSending] = useState(false);

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

  const accepted = applications.filter(
    (a) => a.status === "accepted" || a.status === "confirmed"
  );

  const filtered =
    filter === "arrived"
      ? accepted.filter((a) => a.checked_in_at)
      : filter === "not_arrived"
        ? accepted.filter((a) => !a.checked_in_at)
        : accepted;

  const handleCheckIn = async (appId: string) => {
    const res = await fetchWithTimeout(
      `/api/recruitments/${resolvedId}/applications/${appId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checked_in_at: true }),
      }
    );
    if (res.ok) load();
  };

  const handleRoleAssign = async (appId: string, role: string) => {
    const res = await fetchWithTimeout(
      `/api/recruitments/${resolvedId}/applications/${appId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role_assigned: role }),
      }
    );
    if (res.ok) load();
  };

  const handleBulkMessage = async (content: string) => {
    if (!resolvedId) return;
    setBulkSending(true);
    try {
      const res = await fetchWithTimeout(
        `/api/recruitments/${resolvedId}/bulk-message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );
      const data = await res.json();
      if (res.ok) alert(`${data.sent ?? 0}件送信しました`);
      else alert(data.error ?? "送信に失敗しました");
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

  const roleOptions = recruitment.roles?.map((r) => r.name) ?? ["受付", "誘導", "物販"];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--accent)]/10 dark:bg-[var(--accent)]/20">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Breadcrumb
            items={[
              { label: "トップ", href: "/" },
              { label: "募集管理", href: "/organizer/recruitments" },
              { label: recruitment.title, href: `/organizer/recruitments/${resolvedId}` },
              { label: "当日モード" },
            ]}
          />
          <h1 className="mt-2 text-xl font-bold">当日モード</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            集合: {recruitment.meeting_place ?? "未定"} · 採用 {accepted.length} 名
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <section className="rounded-xl border border-[var(--border)] bg-white p-4 dark:bg-[var(--background)]">
          <h2 className="font-semibold">一斉連絡</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleBulkMessage("今から集合してください。")}
              disabled={bulkSending || accepted.length === 0}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 disabled:opacity-50"
            >
              今から集合
            </button>
            <button
              type="button"
              onClick={() => handleBulkMessage("休憩です。戻りましたらお知らせください。")}
              disabled={bulkSending || accepted.length === 0}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 disabled:opacity-50"
            >
              休憩お知らせ
            </button>
            <button
              type="button"
              onClick={() => handleBulkMessage("片付けを開始します。集まってください。")}
              disabled={bulkSending || accepted.length === 0}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 disabled:opacity-50"
            >
              片付け開始
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-[var(--border)] bg-white p-4 dark:bg-[var(--background)]">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">名簿</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`rounded px-2 py-1 text-sm ${
                  filter === "all"
                    ? "bg-[var(--accent)] text-white"
                    : "bg-zinc-100 dark:bg-zinc-700"
                }`}
              >
                全員
              </button>
              <button
                type="button"
                onClick={() => setFilter("arrived")}
                className={`rounded px-2 py-1 text-sm ${
                  filter === "arrived"
                    ? "bg-emerald-600 text-white"
                    : "bg-zinc-100 dark:bg-zinc-700"
                }`}
              >
                到着
              </button>
              <button
                type="button"
                onClick={() => setFilter("not_arrived")}
                className={`rounded px-2 py-1 text-sm ${
                  filter === "not_arrived"
                    ? "bg-amber-500 text-white"
                    : "bg-zinc-100 dark:bg-zinc-700"
                }`}
              >
                未到着
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">
              {accepted.length === 0
                ? "採用者がいません"
                : "該当するスタッフがいません"}
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {filtered.map((app) => (
                <li
                  key={app.id}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    app.checked_in_at
                      ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10"
                      : "border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  <div>
                    <p className="font-medium">
                      {(app.user as { display_name?: string })?.display_name ??
                        app.user_id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {app.checked_in_at
                        ? `到着 ${new Date(app.checked_in_at).toLocaleTimeString("ja-JP", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`
                        : "未到着"}
                      {app.role_assigned && ` · ${app.role_assigned}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!app.checked_in_at && (
                      <button
                        type="button"
                        onClick={() => handleCheckIn(app.id)}
                        className="rounded bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700"
                      >
                        到着
                      </button>
                    )}
                    <select
                      value={app.role_assigned ?? ""}
                      onChange={(e) =>
                        handleRoleAssign(app.id, e.target.value || "")
                      }
                      className="rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800"
                    >
                      <option value="">役割</option>
                      {roleOptions.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="text-center">
          <Link
            href={`/organizer/recruitments/${resolvedId}`}
            className="text-sm text-[var(--accent)] hover:underline"
          >
            ← 募集管理に戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
