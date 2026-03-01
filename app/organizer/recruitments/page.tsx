"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { Breadcrumb } from "@/components/breadcrumb";

type Recruitment = {
  id: string;
  title: string;
  description: string;
  status: string;
  start_at: string | null;
  meeting_place: string | null;
  capacity: number | null;
  created_at: string;
};

const STATUS_LABELS: Record<string, string> = {
  draft: "下書き",
  public: "公開中",
  closed: "終了",
};

export default function OrganizerRecruitmentsPage() {
  const [recruitments, setRecruitments] = useState<Recruitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchWithTimeout("/api/recruitments?mine=true")
      .then((r) => {
        if (!r.ok) throw new Error("読み込みに失敗しました");
        return r.json();
      })
      .then((data) => setRecruitments(Array.isArray(data) ? data : []))
      .catch((err) => {
        setRecruitments([]);
        setError(err instanceof Error ? err.message : "読み込みに失敗しました");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/95 backdrop-blur-sm dark:bg-[var(--background)]">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Breadcrumb
            items={[
              { label: "トップ", href: "/" },
              { label: "主催", href: "/organizer/events" },
              { label: "募集管理" },
            ]}
          />
          <div className="mt-2 flex items-center justify-between">
            <h1 className="text-xl font-bold">募集管理</h1>
            <Link
              href="/organizer/recruitments/new"
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              新規作成
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {loading ? (
          <p className="text-zinc-500">読み込み中...</p>
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
            <p>{error}</p>
            <button
              type="button"
              onClick={load}
              className="mt-2 text-sm underline"
            >
              再読み込み
            </button>
          </div>
        ) : recruitments.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-white p-8 text-center dark:bg-[var(--background)]">
            <p className="text-zinc-500">募集がまだありません</p>
            <Link
              href="/organizer/recruitments/new"
              className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              最初の募集を作成
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {recruitments.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/organizer/recruitments/${r.id}`}
                  className="block rounded-xl border border-[var(--border)] bg-white p-4 transition-shadow hover:shadow-md dark:bg-[var(--background)]"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold">{r.title}</h2>
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        r.status === "public"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : r.status === "closed"
                            ? "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                      }`}
                    >
                      {STATUS_LABELS[r.status] ?? r.status}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                    {r.description}
                  </p>
                  {r.meeting_place && (
                    <p className="mt-2 text-xs text-zinc-400">
                      📍 {r.meeting_place}
                    </p>
                  )}
                  <div className="mt-2 flex gap-2 text-xs text-zinc-500">
                    <Link
                      href={`/organizer/recruitments/${r.id}/day-of`}
                      className="text-[var(--accent)] hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      当日モード →
                    </Link>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
