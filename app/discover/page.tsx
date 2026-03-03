"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { EventCard } from "@/app/events/event-card";
import type { Event } from "@/lib/db/types";
import { ProfileLink } from "@/components/profile-link";
import { Breadcrumb } from "@/components/breadcrumb";
import { SectionHeader } from "@/components/home/SectionHeader";

type ContentType = "events" | "volunteer";
type RankingType = "newest" | "popular" | "satisfaction";

const RANKING_TABS: { id: RankingType; label: string }[] = [
  { id: "newest", label: "新着" },
  { id: "popular", label: "人気" },
  { id: "satisfaction", label: "満足度" },
];

export default function DiscoverPage() {
  const [contentType, setContentType] = useState<ContentType>("events");
  const [activeTab, setActiveTab] = useState<RankingType>("popular");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/events/rankings?type=${activeTab}&limit=12`)
      .then((res) => res.json())
      .then((data: Event[]) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-white dark:bg-[var(--background)]">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Breadcrumb
              items={[
                { label: "トップ", href: "/" },
                { label: "探す" },
              ]}
            />
            <ProfileLink />
          </div>
          <h1 className="mt-2 font-serif text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            探す
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 pb-[calc(6rem+env(safe-area-inset-bottom,0px))] sm:px-6">
        {/* イベント / ボランティア 切替 */}
        <div className="mb-6 flex gap-2">
          {(["events", "volunteer"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setContentType(t)}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                contentType === t
                  ? "bg-[var(--accent)] text-white"
                  : "border border-[var(--border)] hover:bg-[var(--accent-soft)]/50 dark:hover:bg-[var(--accent-soft)]/20"
              }`}
            >
              {t === "events" ? "イベント" : "ボランティア"}
            </button>
          ))}
        </div>

        {contentType === "volunteer" ? (
          <section className="space-y-4" aria-label="ボランティア募集">
            <SectionHeader
              title="ボランティア募集"
              subtitle="地域のイベントでお手伝いを"
              href="/volunteer"
            />
            <p className="text-sm text-[var(--foreground-muted)]">
              ボランティア募集一覧で、交通費・宿泊・謝礼などの条件で検索できます。
            </p>
            <Link
              href="/volunteer"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              ボランティア募集を見る
              <span aria-hidden>→</span>
            </Link>
          </section>
        ) : (
          <section className="space-y-4" aria-label="ランキング">
            <SectionHeader
              title="人気ランキング"
              subtitle="新着・人気・満足度で探せる"
              href="/events"
            />
            <div className="mb-4 flex gap-2">
              {RANKING_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-[var(--accent)] text-white"
                    : "border border-[var(--border)] hover:bg-[var(--accent-soft)]/50 dark:hover:bg-[var(--accent-soft)]/20"
                }`}
              >
                {tab.label}
                </button>
              ))}
            </div>

            {loading ? (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <li
                  key={i}
                  className="h-80 animate-pulse rounded-xl border border-[var(--border)] bg-white dark:bg-[var(--background)]"
                />
              ))}
            </ul>
          ) : events.length === 0 ? (
            <div className="rounded-xl border border-[var(--border)] bg-white p-10 text-center dark:bg-[var(--background)]">
              <p className="text-sm text-[var(--foreground-muted)]">
                該当するイベントがありません
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event, idx) => (
                <li key={event.id} className="relative">
                  <span
                    className="absolute left-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-white"
                    aria-hidden
                  >
                    {idx + 1}
                  </span>
                  <EventCard event={event} />
                </li>
              ))}
            </ul>
            )}
          </section>
        )}

        <section className="mt-12 space-y-4" aria-label="その他の探し方">
          <h2 className="font-serif text-lg font-semibold text-zinc-900 dark:text-zinc-100 sm:text-xl">
            その他の探し方
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-medium shadow-sm transition-shadow hover:shadow-md dark:bg-[var(--background)]"
            >
              イベント一覧
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/volunteer"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-medium shadow-sm transition-shadow hover:shadow-md dark:bg-[var(--background)]"
            >
              ボランティア募集
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-medium shadow-sm transition-shadow hover:shadow-md dark:bg-[var(--background)]"
            >
              特集
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/stories"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-medium shadow-sm transition-shadow hover:shadow-md dark:bg-[var(--background)]"
            >
              ストーリー
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
