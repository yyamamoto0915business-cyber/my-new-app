"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  getEvents,
  getEventsByDateRange,
  filterEventsByPrice,
  searchEvents,
} from "@/lib/events";

export default function EventsPage() {
  const [dateRange, setDateRange] = useState<"today" | "week">("week");
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const events = useMemo(() => {
    let result = getEvents();
    result = getEventsByDateRange(result, dateRange);
    result = filterEventsByPrice(result, priceFilter);
    result = searchEvents(result, searchQuery);
    return result;
  }, [dateRange, priceFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ← トップへ
          </Link>
          <h1 className="mt-2 text-2xl font-bold">イベント一覧</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="space-y-4">
          {/* 検索 */}
          <input
            type="search"
            placeholder="イベント名・主催者・場所で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />

          {/* 日付切替 */}
          <div className="flex gap-2">
            <button
              onClick={() => setDateRange("today")}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                dateRange === "today"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
              }`}
            >
              今日
            </button>
            <button
              onClick={() => setDateRange("week")}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                dateRange === "week"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
              }`}
            >
              今週
            </button>
          </div>

          {/* 料金フィルタ */}
          <div className="flex gap-2">
            {(["all", "free", "paid"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setPriceFilter(filter)}
                className={`rounded-lg px-4 py-2 text-sm ${
                  priceFilter === filter
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "border border-zinc-300 dark:border-zinc-700"
                }`}
              >
                {filter === "all" ? "すべて" : filter === "free" ? "無料" : "有料"}
              </button>
            ))}
          </div>
        </div>

        {/* イベント一覧 */}
        <ul className="mt-6 space-y-4">
          {events.length === 0 ? (
            <li className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
              該当するイベントがありません
            </li>
          ) : (
            events.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/events/${event.id}`}
                  className="block rounded-lg border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <h2 className="font-semibold">{event.title}</h2>
                      <p className="mt-1 text-sm text-zinc-500">
                        {event.date} {event.startTime}〜 {event.location}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 self-start rounded px-2 py-1 text-sm ${
                        event.price === 0
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200"
                      }`}
                    >
                      {event.price === 0 ? "無料" : `¥${event.price}`}
                    </span>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>

        <div className="mt-8">
          <Link
            href="/organizer/events"
            className="text-sm text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            主催者向け：イベント管理 →
          </Link>
        </div>
      </main>
    </div>
  );
}
