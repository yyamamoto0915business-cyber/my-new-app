"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

export default function EventRequestDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [request, setRequest] = useState<EventRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(500);
  const [message, setMessage] = useState("");
  const [supporting, setSupporting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/event-requests/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setRequest(data))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupporting(true);
    const supabase = createClient();
    if (!supabase) {
      const res = await fetch(`/api/event-requests/${id}/supports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, message }),
      });
      setSupporting(false);
      if (res.ok) setDone(true);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = `/login?returnTo=${encodeURIComponent(`/event-requests/${id}`)}`;
      setSupporting(false);
      return;
    }
    const res = await fetch(`/api/event-requests/${id}/supports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, message }),
    });
    setSupporting(false);
    if (res.ok) setDone(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">読み込み中...</p>
      </div>
    );
  }
  if (!request) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-zinc-500">提案が見つかりません</p>
        <Link href="/event-requests" className="text-blue-600 underline">
          一覧へ戻る
        </Link>
      </div>
    );
  }

  const percent = Math.min(
    100,
    Math.round((request.current_amount / request.target_amount) * 100)
  );

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Link
            href="/event-requests"
            className="text-sm text-zinc-600 underline-offset-4 hover:underline"
          >
            ← 提案一覧へ
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <article className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {request.title}
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            {request.description}
          </p>
          <div className="mt-4 flex gap-4 text-sm text-zinc-500">
            {request.prefecture && <span>{request.prefecture}{request.city && ` ${request.city}`}</span>}
            {request.display_name && <span>提案者: {request.display_name}</span>}
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm">
              <span>支援状況</span>
              <span>
                {request.current_amount.toLocaleString()}円 /{" "}
                {request.target_amount.toLocaleString()}円 ({percent}%)
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
              <div
                className="h-full bg-[var(--accent)]"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          {!done ? (
            <form onSubmit={handleSupport} className="mt-8 space-y-4 border-t border-zinc-200 pt-6 dark:border-zinc-700">
              <h2 className="font-semibold">支援する</h2>
              <div>
                <label className="block text-sm">金額（円）</label>
                <select
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="mt-1 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <option value={300}>300円</option>
                  <option value={500}>500円</option>
                  <option value={1000}>1,000円</option>
                  <option value={3000}>3,000円</option>
                  <option value={5000}>5,000円</option>
                </select>
              </div>
              <div>
                <label className="block text-sm">応援メッセージ（任意）</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
                />
              </div>
              <button
                type="submit"
                disabled={supporting}
                className="rounded-lg bg-[var(--accent)] px-6 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {supporting ? "送信中..." : "支援する"}
              </button>
            </form>
          ) : (
            <div className="mt-8 rounded-lg bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-200">
              支援ありがとうございます！
            </div>
          )}
        </article>
      </main>
    </div>
  );
}
