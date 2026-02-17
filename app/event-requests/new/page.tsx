"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const PREFECTURES = [
  "東京都",
  "大阪府",
  "北海道",
  "福岡県",
  "愛知県",
  "神奈川県",
  "埼玉県",
  "千葉県",
  "京都府",
];

export default function NewEventRequestPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prefecture, setPrefecture] = useState("");
  const [city, setCity] = useState("");
  const [targetAmount, setTargetAmount] = useState(50000);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const supabase = createClient();
    if (!supabase) {
      setSubmitting(false);
      router.push("/event-requests");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login?returnTo=/event-requests/new";
      setSubmitting(false);
      return;
    }
    const { error } = await supabase.from("event_requests").insert({
      user_id: user.id,
      title,
      description,
      prefecture: prefecture || null,
      city: city || null,
      target_amount: targetAmount,
      current_amount: 0,
      status: "open",
    });
    setSubmitting(false);
    if (!error) router.push("/event-requests");
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <Link
            href="/event-requests"
            className="text-sm text-zinc-500 hover:underline"
          >
            ← 提案一覧へ
          </Link>
          <h1 className="mt-2 text-2xl font-bold">やってほしいイベントを提案する</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div>
            <label htmlFor="title" className="block text-sm font-medium">
              タイトル *
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium">
              説明 *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          <div>
            <label htmlFor="prefecture" className="block text-sm font-medium">
              希望地域
            </label>
            <select
              id="prefecture"
              value={prefecture}
              onChange={(e) => setPrefecture(e.target.value)}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            >
              <option value="">選択</option>
              {PREFECTURES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="targetAmount" className="block text-sm font-medium">
              目標支援金額（円）
            </label>
            <input
              id="targetAmount"
              type="number"
              min={1000}
              step={1000}
              value={targetAmount}
              onChange={(e) => setTargetAmount(Number(e.target.value))}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-[var(--accent)] px-6 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "投稿中..." : "提案を投稿する"}
          </button>
        </form>
      </main>
    </div>
  );
}
