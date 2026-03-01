"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import type { Event } from "@/lib/db/types";
import type { Story } from "@/lib/story-types";
import { getEventsByDateRange } from "@/lib/events";
import { useLanguage } from "./language-provider";
import { EventThumbnail } from "./event-thumbnail";
import { RegionFilter } from "./region-filter";
import { MapHero } from "./MapHero";
import { MapRecruitmentPins } from "./MapRecruitmentPins";
import { StoryCard } from "./story/story-card";

const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"];

function EventCarouselCard({ event }: { event: Event }) {
  const d = new Date(event.date + "T12:00:00");
  const dayLabel = WEEKDAY[d.getDay()];
  const dateStr = event.date.replace(/-/g, "/").replace(/^(\d{4})\/(\d{2})\/(\d{2})$/, "$2/$3");
  const timeStr = event.endTime ? `${event.startTime}-${event.endTime}` : event.startTime;

  return (
    <Link
      href={`/events/${event.id}`}
      className="block w-[280px] shrink-0 overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-[var(--background)]"
    >
      <div className="relative aspect-[16/10]">
        <EventThumbnail
          imageUrl={event.imageUrl}
          alt={event.title}
          rounded="none"
          className="rounded-t-xl"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-2 left-2 right-2 text-white">
          <p className="text-xs font-medium">{event.organizerName}</p>
          <h3 className="mt-0.5 line-clamp-2 font-serif text-sm font-semibold">{event.title}</h3>
        </div>
        {event.price === 0 && (
          <span className="absolute right-2 top-2 rounded bg-white/90 px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
            無料
          </span>
        )}
      </div>
      <div className="flex items-start justify-between gap-2 p-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-[var(--foreground-muted)]">
            {dayLabel} {dateStr} {timeStr}
          </p>
          <p className="mt-0.5 truncate text-xs text-zinc-600 dark:text-zinc-400">{event.location}</p>
        </div>
        <span className="shrink-0 text-sm font-medium text-[var(--accent)]">
          {event.price === 0 ? "無料" : `¥${event.price}`}
        </span>
      </div>
    </Link>
  );
}

function CarouselSection({
  title,
  events,
  loading,
}: {
  title: string;
  events: Event[];
  loading: boolean;
}) {
  return (
    <section className="mb-10">
      <div className="mb-3">
        <h2 className="font-serif text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </h2>
      </div>
      {loading ? (
        <div className="flex gap-4 overflow-x-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 w-[280px] shrink-0 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700"
            />
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--foreground-muted)]">
          該当するイベントがありません
        </p>
      ) : (
        <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide">
          {events.map((e) => (
            <EventCarouselCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </section>
  );
}

export function HomeOtonami() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const prefecture = searchParams.get("prefecture") ?? "";
  const city = searchParams.get("city") ?? "";
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [rankings, setRankings] = useState<Event[]>([]);
  const [collections, setCollections] = useState<{ id: string; slug: string; title: string; eventIds: string[] }[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [recommendedRecruitments, setRecommendedRecruitments] = useState<{ id: string; title: string; meeting_place: string | null; start_at: string | null; organizers?: { organization_name: string | null } }[]>([]);
  const [allRecruitments, setAllRecruitments] = useState<{ id: string; title: string; description: string; meeting_place: string | null; organizers?: { organization_name: string | null } }[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (prefecture) params.set("prefecture", prefecture);
    if (city) params.set("city", city);
    const qs = params.toString();

    Promise.all([
      fetchWithTimeout(`/api/events${qs ? `?${qs}` : ""}`, { cache: "no-store" }).then((r) =>
        r.json()
      ),
      fetchWithTimeout("/api/events/rankings?type=popular&limit=8", { cache: "no-store" }).then((r) =>
        r.json()
      ),
      fetchWithTimeout("/api/collections", { cache: "no-store" }).then((r) => r.json()),
      fetchWithTimeout("/api/stories?limit=3", { cache: "no-store" }).then((r) => r.json()),
      fetchWithTimeout("/api/recruitments?recommended=true&limit=3", { cache: "no-store" }).then((r) =>
        r.json()
      ),
      fetchWithTimeout("/api/recruitments?limit=20", { cache: "no-store" }).then((r) =>
        r.json()
      ),
    ])
      .then(([events, ranked, colls, storyList, recRecommended, recAll]) => {
        setAllEvents(Array.isArray(events) ? events : []);
        setRankings(Array.isArray(ranked) ? ranked : []);
        setCollections(Array.isArray(colls) ? colls : []);
        setStories(Array.isArray(storyList) ? storyList : []);
        setRecommendedRecruitments(Array.isArray(recRecommended) ? recRecommended : []);
        setAllRecruitments(Array.isArray(recAll) ? recAll : []);
      })
      .catch(() => {
        setAllEvents([]);
        setRankings([]);
        setCollections([]);
        setStories([]);
        setRecommendedRecruitments([]);
        setAllRecruitments([]);
      })
      .finally(() => setLoading(false));
  }, [prefecture, city]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pickupEvents = getEventsByDateRange(allEvents, "week");
  const displayPickup = pickupEvents.length > 0 ? pickupEvents : allEvents;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/95 backdrop-blur-sm dark:bg-[var(--background)]">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <h1 className="font-serif text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                {t.platformTitle}
              </h1>
              <RegionFilter variant="compact" className="shrink-0" />
              <Link
                href="/stories"
                className="flex shrink-0 items-center gap-1 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent-soft)] dark:bg-[var(--background)] dark:hover:bg-[var(--accent-soft)]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                ストーリー
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <MapHero events={allEvents} />

        <MapRecruitmentPins recruitments={recommendedRecruitments} />

        <section className="mb-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              募集一覧
            </h2>
            <Link
              href="/recruitments"
              className="text-sm text-[var(--accent)] hover:underline"
            >
              すべて見る →
            </Link>
          </div>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700"
                />
              ))}
            </div>
          ) : allRecruitments.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--foreground-muted)]">
              募集中のスタッフはいません
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {allRecruitments.slice(0, 6).map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/recruitments/${r.id}`}
                    className="block rounded-xl border border-[var(--border)] bg-white p-4 transition-shadow hover:shadow-md dark:bg-[var(--background)]"
                  >
                    <h3 className="line-clamp-2 font-semibold">{r.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                      {r.description}
                    </p>
                    {r.meeting_place && (
                      <p className="mt-2 truncate text-xs text-zinc-400">
                        📍 {r.meeting_place}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <CarouselSection
          title="ピックアップ"
          events={displayPickup.slice(0, 10)}
          loading={loading}
        />

        <section className="mb-10">
          <div className="mb-3">
            <h2 className="font-serif text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              おすすめストーリー
            </h2>
          </div>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-56 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-700"
                />
              ))}
            </div>
          ) : stories.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--foreground-muted)]">
              ストーリーはまだありません
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {stories.map((s) => (
                <StoryCard key={s.id} story={s} />
              ))}
            </div>
          )}
        </section>

        {collections.slice(0, 2).map((c) => (
          <CarouselSection
            key={c.id}
            title={c.title}
            events={allEvents.filter((e) => c.eventIds?.includes(e.id)).slice(0, 8)}
            loading={false}
          />
        ))}

        <CarouselSection
          title="人気ランキング"
          events={rankings}
          loading={loading}
        />
      </main>
    </div>
  );
}
