"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { EventCard } from "@/app/events/event-card";
import type { Event } from "@/lib/db/types";
import { ProfileLink } from "@/components/profile-link";
import { Breadcrumb } from "@/components/breadcrumb";

type RankingType = "newest" | "popular" | "satisfaction";

const TABS: { id: RankingType; label: string }[] = [
  { id: "newest", label: "新着" },
  { id: "popular", label: "人気" },
  { id: "satisfaction", label: "満足度" },
];

export default function RankingsPage() {
  const [activeTab, setActiveTab] = useState<RankingType>("newest");
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
                { label: "ランキング" },
              ]}
            />
            <ProfileLink />
          </div>
          <h1 className="mt-2 font-serif text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            イベントランキング
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex gap-2">
          {TABS.map((tab) => (
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

        <div className="mt-8">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--accent)] hover:underline"
          >
            イベント一覧を見る
            <span aria-hidden>→</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
