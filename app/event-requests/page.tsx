"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParamsNoSuspend } from "@/lib/use-search-params-no-suspend";
import { Breadcrumb } from "@/components/breadcrumb";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";

type EventRequest = {
  id: string;
  title: string;
  description: string;
  prefecture: string | null;
  city: string | null;
  target_amount: number;
  current_amount: number;
  status: string;
  display_name?: string;
};

function EventRequestsPageContent() {
  const searchParams = useSearchParamsNoSuspend();
  const prefecture = searchParams.get("prefecture") ?? "";
  const city = searchParams.get("city") ?? "";
  const [requests, setRequests] = useState<EventRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (prefecture) params.set("prefecture", prefecture);
    if (city) params.set("city", city);
    const qs = params.toString();
    fetchWithTimeout(`/api/event-requests${qs ? `?${qs}` : ""}`)
      .then((r) => r.json())
      .then((data) => setRequests(Array.isArray(data) ? data : []))
      .catch(() => {
        setRequests([]);
        setError("読み込みに失敗しました");
      })
      .finally(() => setLoading(false));
  }, [prefecture, city]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Breadcrumb items={[{ label: "トップ", href: "/?mode=select" }, { label: "やってほしいイベント" }]} />
          <h1 className="mt-2 text-2xl font-bold">
            やってほしいイベント
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            参加者が提案したイベントに支援できます
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6">
          <Link
            href="/event-requests/new"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            提案を投稿する
          </Link>
        </div>

        {loading ? (
          <p className="text-zinc-500">読み込み中...</p>
        ) : error ? (
          <div>
            <p className="text-red-600">{error}</p>
            <button
              type="button"
              onClick={load}
              className="mt-2 text-sm text-[var(--accent)] underline"
            >
              再読み込み
            </button>
          </div>
        ) : (
          <ul className="space-y-4">
            {requests.length === 0 ? (
              <li className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
                提案はありません
              </li>
            ) : (
              requests.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/event-requests/${r.id}`}
                    className="block rounded-lg border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {r.title}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {r.description}
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-sm text-zinc-500">
                      <span>
                        {r.prefecture}
                        {r.city && ` ${r.city}`}
                      </span>
                      <span>
                        支援 {r.current_amount.toLocaleString()}円 / 目標{" "}
                        {r.target_amount.toLocaleString()}円
                      </span>
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
        )}
      </main>
    </div>
  );
}

export default function EventRequestsPage() {
  return <EventRequestsPageContent />;
}
